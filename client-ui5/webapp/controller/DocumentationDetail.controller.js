sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("invoice.app.controller.DocumentationDetail", {

        onInit: function () {
            this.getView().setModel(new JSONModel([]), "fields");
            this.getOwnerComponent().getRouter().getRoute("documentationDetail").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            this._sObjectId = oEvent.getParameter("arguments").id;
            this._loadData(this._sObjectId);
        },

        _loadData: function (id) {
            // Fetch existing data for this ID
            fetch(`/api/documentation-xml/${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.fields_data) {
                        this.getView().getModel("fields").setData(data.fields_data);
                    } else {
                        this.getView().getModel("fields").setData([]);
                    }
                    this.getView().bindElement({
                        path: "/documentation-xml/" + id,
                        model: "doc" // Assuming a main model exists, or we fetch just for this view
                    });
                })
                .catch(err => console.error("Error loading details:", err));
        },

        onNavBack: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("documentationXml", {}, true);
        },

        onFileChange: function (oEvent) {
            var oFileUploader = oEvent.getSource();
            var oFile = oEvent.getParameter("files") && oEvent.getParameter("files")[0];

            if (!oFile) {
                return;
            }

            var reader = new FileReader();
            reader.onload = function (e) {
                var sContent = e.target.result;
                this._parseFileContent(sContent, oFile.type, oFile.name);
            }.bind(this);
            reader.readAsText(oFile);
        },

        _parseFileContent: function (sContent, sType, sName) {
            var aFields = [];
            try {
                var oParser = new DOMParser();
                var oXmlDoc = oParser.parseFromString(sContent, "text/xml");

                if (oXmlDoc.getElementsByTagName("parsererror").length > 0) {
                    throw new Error("Error parsing XML");
                }

                var root = oXmlDoc.documentElement;
                var sNamespace = "";
                if (root.nodeName.indexOf(":") > -1) {
                    var parts = root.nodeName.split(":");
                    if (parts[1] === "schema") sNamespace = parts[0] + ":";
                }

                // 1. Index Types and Elements globally
                var typeMap = {}; // name -> node
                var elementMap = {}; // name -> node
                var schemaChildren = root.childNodes;

                for (var i = 0; i < schemaChildren.length; i++) {
                    var node = schemaChildren[i];
                    if (node.nodeType !== 1) continue;

                    var localName = node.nodeName.split(":").pop();
                    var name = node.getAttribute("name");
                    if (name) {
                        if (localName === "complexType" || localName === "simpleType") {
                            typeMap[name] = node;
                        } else if (localName === "element") {
                            // Elements at root level
                            elementMap[name] = node;
                        }
                    }
                }

                // 2. Recursive Traversal Wrapper
                var context = this;

                // --- HELPER FUNCTIONS ---

                var cleanName = function (n) { return n; };

                // Function to find immediate children by tag name (ignoring ns prefix for safety)
                var getChildren = function (node, tagName) {
                    var res = [];
                    for (var k = 0; k < node.childNodes.length; k++) {
                        var child = node.childNodes[k];
                        if (child.nodeType === 1) {
                            var childLocal = child.nodeName.split(":").pop();
                            if (childLocal === tagName) {
                                res.push(child);
                            }
                        }
                    }
                    return res;
                };

                // Recursive processor (Defined as var to allow safe hoisting within this scope if needed, but better to just use it)
                var processNode = function (node, currentPath) {
                    // "node" is an xs:element definition
                    var name = node.getAttribute("name");
                    var ref = node.getAttribute("ref");
                    var type = node.getAttribute("type");
                    var minOccurs = node.getAttribute("minOccurs");

                    // Handle Reference
                    if (ref) {
                        var refClean = ref.split(":").pop();
                        var refNode = elementMap[refClean];
                        if (refNode) {
                            return processNode(refNode, currentPath);
                        } else {
                            return {
                                name: refClean,
                                xpath: currentPath + "/" + refClean,
                                type: "Ref: " + ref,
                                description: "External Reference",
                                sapStructure: "",
                                isLeaf: true,
                                required: (minOccurs !== "0") ? "Yes" : "No",
                                children: []
                            };
                        }
                    }

                    if (!name) return null;

                    var fullPath = currentPath ? currentPath + "/" + name : "/" + name;
                    var description = context._getDocumentation(node, sNamespace);
                    var isLeaf = true;
                    var nodeChildren = [];

                    var typeNode = null;

                    if (type) {
                        var typeClean = type.split(":").pop();
                        if (type.startsWith("xs:") || type.startsWith("xsd:")) {
                            isLeaf = true;
                        } else if (typeMap[typeClean]) {
                            typeNode = typeMap[typeClean];
                            var typeLocal = typeNode.nodeName.split(":").pop();
                            if (typeLocal === "complexType") {
                                isLeaf = false;
                            } else {
                                isLeaf = true; // simpleType
                                description = description || context._getDocumentation(typeNode, sNamespace);
                            }
                        } else {
                            isLeaf = true;
                        }
                    } else {
                        var inlineComplex = getChildren(node, "complexType")[0];
                        if (inlineComplex) {
                            typeNode = inlineComplex;
                            isLeaf = false;
                        }
                    }

                    if (!isLeaf && typeNode) {
                        traverseStructure(typeNode, fullPath, nodeChildren);
                    }

                    if (nodeChildren.length > 0) isLeaf = false;

                    return {
                        name: cleanName(name),
                        xpath: fullPath,
                        type: type || "Inline",
                        description: description,
                        sapStructure: "",
                        isLeaf: isLeaf,
                        required: (minOccurs !== "0") ? "Yes" : "No",
                        children: nodeChildren
                    };
                };

                // Helper to traverse inside a complexType
                var traverseStructure = function (typeNode, currentPath, childrenList) {
                    var complexContent = getChildren(typeNode, "complexContent")[0];
                    if (complexContent) {
                        var extension = getChildren(complexContent, "extension")[0];
                        if (extension) {
                            var base = extension.getAttribute("base");
                            if (base) {
                                var baseClean = base.split(":").pop();
                                if (typeMap[baseClean]) {
                                    traverseStructure(typeMap[baseClean], currentPath, childrenList);
                                }
                            }
                            processContainerChildren(extension, currentPath, childrenList);
                        }
                        return;
                    }
                    processContainerChildren(typeNode, currentPath, childrenList);
                };

                // Helper to process sequence, choice, all
                var processContainerChildren = function (parentNode, currentPath, childrenList) {
                    var childs = parentNode.childNodes;
                    for (var i = 0; i < childs.length; i++) {
                        var n = childs[i];
                        if (n.nodeType !== 1) continue;
                        var local = n.nodeName.split(":").pop();

                        if (local === "sequence" || local === "choice" || local === "all") {
                            processContainerChildren(n, currentPath, childrenList);
                        } else if (local === "element") {
                            var childObj = processNode(n, currentPath);
                            if (childObj) childrenList.push(childObj);
                        }
                    }
                };

                // --- EXECUTION START ---

                // Build Root Tree
                var aRootFields = [];
                Object.keys(elementMap).forEach(function (key) {
                    if (key === "Facturae" || Object.keys(elementMap).length === 1) {
                        var rootObj = processNode(elementMap[key], "");
                        if (rootObj) aRootFields.push(rootObj);
                    }
                });
                if (aRootFields.length === 0 && Object.keys(elementMap).length > 0) {
                    Object.keys(elementMap).forEach(function (key) {
                        var rootObj = processNode(elementMap[key], "");
                        if (rootObj) aRootFields.push(rootObj);
                    });
                }

                console.log("XSD Parsed Data Structure:", aRootFields);

                // Wrap in a root object if needed for TreeTable binding
                var oData = { root: aRootFields };
                this.getView().getModel("fields").setData(oData);
                MessageToast.show("Fichero procesado. Nodos raíz: " + aRootFields.length);

            } catch (error) {
                console.error(error);
                MessageBox.error("Error al procesar el fichero: " + error.message);
            }
        },
        _getDocumentation: function (node, sNamespace) {
            var doc = "";
            var annotation = node.getElementsByTagName(sNamespace + "annotation")[0];
            if (!annotation) annotation = node.getElementsByTagName("annotation")[0]; // try no ns

            if (annotation) {
                var docNodes = annotation.getElementsByTagName(sNamespace + "documentation");
                if (docNodes.length === 0) docNodes = annotation.getElementsByTagName("documentation");

                // Determine current language (e.g. "es", "en")
                var sCurrentLang = sap.ui.getCore().getConfiguration().getLanguage().split("-")[0].toLowerCase();
                var sFallbackDoc = "";
                var sMatchDoc = "";

                for (var i = 0; i < docNodes.length; i++) {
                    var t = docNodes[i].textContent.trim();
                    var l = docNodes[i].getAttribute("xml:lang");

                    if (t) {
                        // Store the first one as fallback
                        if (!sFallbackDoc) sFallbackDoc = t;

                        // Check if language matches
                        if (l && l.toLowerCase().startsWith(sCurrentLang)) {
                            sMatchDoc = t;
                            break; // Stop once we find the matching language
                        }
                    }
                }

                // Use matched language, otherwise fallback to the first available description
                doc = sMatchDoc || sFallbackDoc;
            }
            return doc;
        },

        _extractChildrenFromType: function (typeNode, sNamespace, typeMap) {
            var children = [];
            var context = this;

            // Look for sequence, choice, all?
            // They can be nested. Flatten for simplicity or recurse?
            // Simple flatten of "xs:element" descendants for now.
            // Note: complexContent/extension is tricky.

            // Helper to scan for elements inside a container
            var scan = function (container) {
                var els = container.getElementsByTagName(sNamespace + "element");
                if (els.length === 0) els = container.getElementsByTagName("element");

                for (var i = 0; i < els.length; i++) {
                    var el = els[i];
                    var name = el.getAttribute("name");
                    if (name) {
                        var type = el.getAttribute("type");
                        var doc = context._getDocumentation(el, sNamespace);
                        children.push({ name: name, type: type, doc: doc });
                    } else {
                        // Ref? <xs:element ref="ds:Signature"/>
                        var ref = el.getAttribute("ref");
                        if (ref) {
                            // Handle Reference (stripped namespace for display)
                            children.push({ name: ref, type: "Ref", doc: "Reference to " + ref });
                        }
                    }
                }
            };

            scan(typeNode);
            return children;
        },

        onSave: function () {
            var aFields = this.getView().getModel("fields").getData();

            fetch(`/api/documentation-xml/${this._sObjectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fields_data: aFields })
            })
                .then(res => {
                    if (!res.ok) throw new Error("Failed to save");
                    return res.json();
                })
                .then(() => {
                    MessageToast.show("Datos guardados correctamente");
                })
                .catch(err => {
                    MessageBox.error("Error al guardar: " + err.message);
                });
        },

        onOpenNoteDialog: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext("fields");
            var sPath = oContext.getPath();

            if (!this._oNoteDialog) {
                this._oNoteDialog = new sap.m.Dialog({
                    title: "Notas del Campo",
                    contentWidth: "500px",
                    contentHeight: "300px",
                    content: new sap.m.TextArea({
                        value: "{fields>notes}",
                        width: "100%",
                        height: "100%",
                        rows: 10,
                        placeholder: "Escriba sus notas aquí..."
                    }),
                    beginButton: new sap.m.Button({
                        text: "Cerrar",
                        press: function () {
                            this._oNoteDialog.close();
                        }.bind(this)
                    })
                });
                this.getView().addDependent(this._oNoteDialog);
            }

            this._oNoteDialog.bindElement({
                path: sPath,
                model: "fields"
            });
            this._oNoteDialog.open();
        },

        onAIAction: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext("fields");
            var oModel = this.getView().getModel("fields");
            var sPath = oContext.getPath();
            var oData = oContext.getObject();

            if (!this._oAIDialog) {
                var oVBox = new sap.m.VBox({
                    items: [
                        new sap.m.Title({ text: "Contexto del Campo", level: "H3" }),
                        new sap.m.Label({ text: "Nombre:", design: "Bold" }),
                        new sap.m.Text({ text: "{fields>/aiContext/name}" }),
                        new sap.m.Label({ text: "Tipo:", design: "Bold" }),
                        new sap.m.Text({ text: "{fields>/aiContext/type}" }),
                        new sap.m.Label({ text: "Descripción:", design: "Bold" }),
                        new sap.m.Text({ text: "{fields>/aiContext/description}" }),

                        new sap.m.Label({ text: "Tu Consulta:", design: "Bold" }).addStyleClass("sapUiSmallMarginTop"),
                        new sap.m.HBox({
                            width: "100%",
                            alignItems: "End", // Align button to bottom of text area
                            items: [
                                new sap.m.TextArea({
                                    value: "{fields>/aiContext/userQuery}",
                                    width: "100%",
                                    rows: 2,
                                    placeholder: "Escribe tu pregunta a la IA..."
                                }).addStyleClass("sapUiTinyMarginEnd").setLayoutData(new sap.m.FlexItemData({ growFactor: 1 })),

                                new sap.m.Button({
                                    icon: "sap-icon://paper-plane", // Arrow/Send icon
                                    type: "Emphasized",
                                    tooltip: "Enviar consulta",
                                    press: function () {
                                        var oDialogModel = this._oAIDialog.getModel("fields");
                                        var oContextData = oDialogModel.getProperty("/aiContext");

                                        oDialogModel.setProperty("/aiContext/isBusy", true);
                                        oDialogModel.setProperty("/aiContext/recommendation", ""); // Clear previous

                                        fetch("/api/ai/mapping-recommendation", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                fieldName: oContextData.name,
                                                fieldType: oContextData.type,
                                                description: oContextData.description,
                                                userQuery: oContextData.userQuery
                                            })
                                        })
                                            .then(res => res.json())
                                            .then(data => {
                                                if (data.recommendation) {
                                                    var sText = "Recomendación: " + data.recommendation + "\n\nRazonamiento: " + (data.reasoning || "");
                                                    oDialogModel.setProperty("/aiContext/recommendation", sText);
                                                    oDialogModel.setProperty("/aiContext/suggestedValue", data.recommendation);
                                                } else {
                                                    var sError = data.error || data.reasoning || "Respuesta desconocida del servidor.";
                                                    oDialogModel.setProperty("/aiContext/recommendation", "No se pudo obtener una recomendación.\n\nDetalle: " + sError);
                                                }
                                            })
                                            .catch(err => {
                                                oDialogModel.setProperty("/aiContext/recommendation", "Error al conectar con IA: " + err.message);
                                            })
                                            .finally(() => {
                                                oDialogModel.setProperty("/aiContext/isBusy", false);
                                            });
                                    }.bind(this)
                                })
                            ]
                        }),

                        // Busy Indicator visible only when busy
                        new sap.m.BusyIndicator({
                            size: "2.5rem",
                            visible: "{fields>/aiContext/isBusy}"
                        }).addStyleClass("sapUiMediumMarginTop").addStyleClass("sapUiMediumMarginBottom"),

                        new sap.m.Label({
                            text: "Respuesta:",
                            design: "Bold",
                            visible: {
                                path: "fields>/aiContext/isBusy",
                                formatter: function (bBusy) { return !bBusy; }
                            }
                        }).addStyleClass("sapUiMediumMarginTop"),

                        this._oRecommendationTextArea = new sap.m.TextArea({
                            value: "{fields>/aiContext/recommendation}",
                            width: "100%",
                            rows: 8,
                            editable: false,
                            placeholder: "La recomendación aparecerá aquí...",
                            visible: {
                                path: "fields>/aiContext/isBusy",
                                formatter: function (bBusy) { return !bBusy; }
                            }
                        })
                    ]
                });
                oVBox.addStyleClass("sapUiSmallMargin"); // Apply class after creation

                this._oAIDialog = new sap.m.Dialog({
                    title: "Asistente IA de Mapeo",
                    contentWidth: "600px",
                    contentHeight: "500px",
                    verticalScrolling: true,
                    content: [oVBox],
                    beginButton: new sap.m.Button({
                        text: "Confirmar y Aplicar",
                        type: "Accept",
                        press: function () {
                            var oDialogModel = this._oAIDialog.getModel("fields");
                            var sSuggested = oDialogModel.getProperty("/aiContext/suggestedValue");
                            var sTargetPath = oDialogModel.getProperty("/aiContext/targetPath");

                            // Check for manual selection in TextArea
                            var sSelectedText = "";
                            if (this._oRecommendationTextArea && this._oRecommendationTextArea.getDomRef("inner")) {
                                var oDom = this._oRecommendationTextArea.getDomRef("inner");
                                if (oDom.selectionStart !== oDom.selectionEnd) {
                                    sSelectedText = oDom.value.substring(oDom.selectionStart, oDom.selectionEnd).trim();
                                }
                            }

                            // Use selected text if available, otherwise suggested value
                            var sFinalValue = sSelectedText || sSuggested;

                            if (sFinalValue) {
                                oDialogModel.setProperty(sTargetPath + "/sapStructure", sFinalValue);
                                MessageToast.show("Valor aplicado: " + sFinalValue);
                            }
                            this._oAIDialog.close();
                        }.bind(this)
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancelar",
                        press: function () {
                            this._oAIDialog.close();
                        }.bind(this)
                    })
                });
                this.getView().addDependent(this._oAIDialog);
            }

            // Determine default query based on language
            var sCurrentLang = sap.ui.getCore().getConfiguration().getLanguage().split("-")[0].toLowerCase();
            var sDefaultQuery = (sCurrentLang === "es")
                ? "¿Qué valor me recomiendas incluir en este campo?"
                : "What value do you recommend mapping to this field?";

            // Prepare context data for the dialog
            var oDialogContext = {
                name: oData.name,
                type: oData.type,
                description: oData.description,
                recommendation: "",
                suggestedValue: "",
                targetPath: sPath,
                userQuery: sDefaultQuery,
                isBusy: false
            };

            oModel.setProperty("/aiContext", oDialogContext);
            this._oAIDialog.open();
        }
    });
});
