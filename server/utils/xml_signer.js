const { SignedXml } = require('xml-crypto');
const { DOMParser, XMLSerializer } = require('xmldom');
const forge = require('node-forge');
const xpath = require('xpath');

/**
 * Custom KeyInfo provider to include X509Certificate
 */
class X509KeyInfo {
    constructor(certPem) {
        this.certPem = certPem;
    }

    getKeyInfo(key, prefix) {
        prefix = prefix ? prefix + ':' : '';
        // Clean PEM
        const cleanCert = this.certPem
            .replace(/-----BEGIN CERTIFICATE-----/g, '')
            .replace(/-----END CERTIFICATE-----/g, '')
            .replace(/\r/g, '')
            .replace(/\n/g, '');

        return `<${prefix}X509Data><${prefix}X509Certificate>${cleanCert}</${prefix}X509Certificate></${prefix}X509Data>`;
    }
}

function signXml(xmlContent, p12Buffer, password) {
    // 1. Parse P12
    const p12Der = p12Buffer.toString('binary');
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password || '');

    // Get Private Key
    let keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    let keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag] ? keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0] : null;

    if (!keyBag) {
        keyBags = p12.getBags({ bagType: forge.pki.oids.keyBag });
        keyBag = keyBags[forge.pki.oids.keyBag] ? keyBags[forge.pki.oids.keyBag][0] : null;
    }

    if (!keyBag) {
        throw new Error("No private key found in P12");
    }

    const key = keyBag.key;
    const privateKeyPem = forge.pki.privateKeyToPem(key);

    // Get Certificate
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag][0];
    const cert = certBag.cert;
    const certPem = forge.pki.certificateToPem(cert);

    // Compute Cert Hash (XAdes)
    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
    const md = forge.md.sha256.create();
    md.update(certDer);
    const certHashBase64 = forge.util.encode64(md.digest().getBytes());

    // Issuer & Serial
    const issuerName = formatDistinguishedName(cert.issuer);
    const serialNumber = cert.serialNumber; // String (hex sometimes, need to check if decimal required)
    // Most schemas req decimal serial. Forge serialNumber is usually hex string.
    // We might need to convert hex to decimal. For now check if BigInt works.
    let serialDecimal = serialNumber;
    try {
        if (serialNumber.startsWith('0x')) serialDecimal = BigInt(serialNumber).toString();
        else serialDecimal = BigInt('0x' + serialNumber).toString();
    } catch (e) {
        // Fallback
    }

    // 2. Prepare XML DOM
    const doc = new DOMParser().parseFromString(xmlContent);

    // 3. Generate IDs
    const signatureId = "Signature-" + generateRandomId();
    const signedPropsId = "SignedProperties-" + signatureId;
    const objectId = "XadesObject-" + signatureId;

    // 4. Construct XAdES Object XML
    // Note: Namespaces are crucial.
    const xadesObject = `
    <ds:Object xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="${objectId}">
        <xades:QualifyingProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Target="#${signatureId}">
            <xades:SignedProperties Id="${signedPropsId}">
                <xades:SignedSignatureProperties>
                    <xades:SigningTime>${new Date().toISOString()}</xades:SigningTime>
                    <xades:SigningCertificate>
                        <xades:Cert>
                            <xades:CertDigest>
                                <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                                <ds:DigestValue>${certHashBase64}</ds:DigestValue>
                            </xades:CertDigest>
                            <xades:IssuerSerial>
                                <ds:X509IssuerName>${issuerName}</ds:X509IssuerName>
                                <ds:X509SerialNumber>${serialDecimal}</ds:X509SerialNumber>
                            </xades:IssuerSerial>
                        </xades:Cert>
                    </xades:SigningCertificate>
                </xades:SignedSignatureProperties>
            </xades:SignedProperties>
        </xades:QualifyingProperties>
    </ds:Object>
    `;

    // 5. Create Template Signature with Object - REMOVED
    // We will inject the Object via getKeyInfo override because xml-crypto doesn't support custom element injection into Signature.
    // const sigTemplateStr = `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="${signatureId}">${xadesObject}</ds:Signature>`;
    // const sigTemplateNode = new DOMParser().parseFromString(sigTemplateStr).documentElement;
    // doc.documentElement.appendChild(sigTemplateNode);

    // 6. Sign using xml-crypto
    const sig = new SignedXml();
    sig.signatureAlgorithm = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";
    sig.canonicalizationAlgorithm = "http://www.w3.org/2001/10/xml-exc-c14n#";
    sig.signingKey = privateKeyPem;
    sig.privateKey = privateKeyPem; // EXPLICIT SET in case setter is missing
    sig.keyInfoProvider = new X509KeyInfo(certPem);

    // Override getKeyInfo to inject XAdES Object after KeyInfo
    const originalGetKeyInfo = sig.getKeyInfo;
    sig.getKeyInfo = function (prefix) {
        const keyInfoXml = originalGetKeyInfo.call(this, prefix);
        return keyInfoXml + xadesObject;
    };

    // TEMPORARILY Append Object to Doc so Reference can find it
    const xadesNode = new DOMParser().parseFromString(xadesObject).documentElement;
    doc.documentElement.appendChild(xadesNode);

    // Ref 1: Root (Enveloped)
    // We must exclude the xadesObject from the Root calculation because it will eventually be inside the Signature (which Enveloped removes).
    sig.addReference({
        xpath: "//*[count(ancestor-or-self::*[@Id='" + objectId + "']) = 0]",
        transforms: ["http://www.w3.org/2000/09/xmldsig#enveloped-signature", "http://www.w3.org/TR/2001/REC-xml-c14n-20010315"],
        digestAlgorithm: "http://www.w3.org/2001/04/xmlenc#sha256",
        isEmptyUri: true
    });

    // Ref 2: SignedProperties (Exclusive C14N to remain valid)
    sig.addReference({
        xpath: "//*[@Id='" + signedPropsId + "']",
        transforms: ["http://www.w3.org/2001/10/xml-exc-c14n#"],
        digestAlgorithm: "http://www.w3.org/2001/04/xmlenc#sha256",
        uri: "#" + signedPropsId
    });

    // Compute Signature (appends to root by default, correctly)
    try {
        sig.computeSignature(doc.toString(), {
            attrs: { Id: signatureId } // Ensure Signature has the ID we referenced
        });
    } catch (e) {
        console.error("xml-crypto computeSignature failed:", e);
        throw e;
    }

    return cleanSignedXml(sig.getSignedXml(), objectId);
}

/**
 * Helper to remove the temporary object from the signed XML string.
 * This is necessary because we appended it to the doc for signing, but xml-crypto captured it in the output.
 * We want the ONLY copy to be the one inside the Signature (injected by getKeyInfo).
 */
function cleanSignedXml(signedXml, objectId) {
    const doc = new DOMParser().parseFromString(signedXml);
    // The temporary object is likely a direct child of the root element
    // XPath to find it: /*/*[@Id='objectId']
    // Or just look for any element with that ID that is NOT inside a Signature?
    // Actually, look for the one that is NOT inside KeyInfo (since getKeyInfo put one there).

    // We can rely on structure:
    // Root -> Object (The temp one)
    // Root -> Signature -> Object (The real one)

    const nodes = xpath.select("//*[@Id='" + objectId + "']", doc);
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        // If parent is Root or not Signature/KeyInfo, remove it.
        // Checking parentNode name is safer.
        if (node.parentNode && node.parentNode.localName !== "KeyInfo" && node.parentNode.localName !== "Signature") {
            node.parentNode.removeChild(node);
        }
    }
    return new XMLSerializer().serializeToString(doc);
}

function generateRandomId() {
    return Math.floor(Math.random() * 1000000000);
}

function formatDistinguishedName(issuer) {
    // RFC 4514 Format: CN=...,O=...,C=...
    // Forge attributes: shortName available?
    // Map forge attrs to string
    return issuer.attributes.map(a => `${a.shortName || a.name}=${a.value}`).join(',');
}

module.exports = { signXml };
