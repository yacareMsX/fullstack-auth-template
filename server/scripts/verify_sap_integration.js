// Axios removed, using native fetch

const jwt = require('jsonwebtoken');
require('dotenv').config({ path: __dirname + '/../.env' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Ignore self-signed certs

// 1. Generate Token
const userId = 1; // Admin usually
const token = jwt.sign({ userId, email: 'admin@example.com', role: 'admin' }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '1h' });

// 2. Sample FacturaE XML
const xmlSample = `
<fe:Facturae xmlns:fe="http://www.facturae.es/Facturae/2014/v3.2.1/Facturae">
  <FileHeader>
    <SchemaVersion>3.2.1</SchemaVersion>
    <Modality>I</Modality>
    <InvoiceIssuerType>EM</InvoiceIssuerType>
  </FileHeader>
  <Parties>
    <SellerParty>
      <TaxIdentification>
        <PersonTypeCode>J</PersonTypeCode>
        <ResidenceTypeCode>R</ResidenceTypeCode>
        <TaxIdentificationNumber>B12345678</TaxIdentificationNumber>
      </TaxIdentification>
      <LegalEntity>
        <CorporateName>SAP INTEGRATION TEST SL</CorporateName>
        <AddressInSpain><Address>Calle Test 123</Address></AddressInSpain>
      </LegalEntity>
    </SellerParty>
    <BuyerParty>
      <TaxIdentification>
        <PersonTypeCode>J</PersonTypeCode>
        <ResidenceTypeCode>R</ResidenceTypeCode>
        <TaxIdentificationNumber>A87654321</TaxIdentificationNumber>
      </TaxIdentification>
      <LegalEntity>
        <CorporateName>CLIENTE PRUEBA SA</CorporateName>
        <AddressInSpain><Address>Avda Cliente 456</Address></AddressInSpain>
      </LegalEntity>
    </BuyerParty>
  </Parties>
  <Invoices>
    <Invoice>
      <InvoiceHeader>
        <InvoiceNumber>SAP001</InvoiceNumber>
        <InvoiceSeriesCode>TEST</InvoiceSeriesCode>
        <InvoiceDocumentType>FC</InvoiceDocumentType>
        <IssueDate>2023-11-01</IssueDate>
      </InvoiceHeader>
      <InvoiceTotals>
        <TotalGrossAmount>100.00</TotalGrossAmount>
        <TotalTaxOutputs>21.00</TotalTaxOutputs>
        <InvoiceTotal>121.00</InvoiceTotal>
      </InvoiceTotals>
      <Items>
        <InvoiceLine>
          <ItemDescription>Producto Prueba SAP</ItemDescription>
          <Quantity>1.00</Quantity>
          <UnitPriceWithoutTax>100.00</UnitPriceWithoutTax>
          <TotalCost>100.00</TotalCost>
          <TaxesOutputs>
            <Tax>
              <TaxRate>21.00</TaxRate>
              <TaxAmount>21.00</TaxAmount>
            </Tax>
          </TaxesOutputs>
        </InvoiceLine>
      </Items>
    </Invoice>
  </Invoices>
</fe:Facturae>
`;

const processId = `SAP_TEST_${Date.now()}`;
const payload = {
    process_id: processId,
    xml_content: Buffer.from(xmlSample).toString('base64'),
    timestamp: new Date().toISOString()
};

async function runtest() {
    console.log(`Testing SAP Integration with Process ID: ${processId}`);
    try {
        // Assume server running on localhost:3000 (standard env)
        // Note: You need to start the server! This script only makes a request.
        // If server is not running, this will fail.

        // Use https because server is configured with SSL
        const response = await fetch('https://localhost:3000/api/integrations/sap/invoice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response Body:', data);

        if (response.status === 201) {
            console.log('SUCCESS: Invoice created via SAP integration');
        } else {
            console.error('FAILED');
        }

    } catch (e) {
        console.error('Error connecting to server:', e.message);
        console.log('Make sure the server is running (npm start in server directory)');
    }
}

runtest();
