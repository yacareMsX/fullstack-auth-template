sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/routing/History"
], function (Controller, JSONModel, MessageToast, History) {
    "use strict";

    return Controller.extend("invoice.app.controller.XmlMapping", {

        onInit: function () {
            // Models for Source and Target trees
            this.getView().setModel(new JSONModel([]), "sourceModel");
            this.getView().setModel(new JSONModel([]), "targetModel");

            // Model to store mappings
            // Structure: { mappings: [ { sourceId: "...", targetId: "..." } ] }
            this.getView().setModel(new JSONModel({ mappings: [] }), "mappingModel");
        },

        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("home", {}, true);
            }
        },

        // --- File Upload & XSD Parsing Logic ---

        onUploadSource: function (oEvent) {
            this._handleFileUpload(oEvent, "sourceModel");
        },

        onUploadTarget: function (oEvent) {
            this._handleFileUpload(oEvent, "targetModel");
        },

        _handleFileUpload: function (oEvent, sModelName) {
            var oFileUploader = oEvent.getSource();
            // In UI5, if multiple=true, files are in oEvent.getParameter("files") (Array)
            var aFiles = oEvent.getParameter("files");

            if (!aFiles || aFiles.length === 0) {
                return;
            }

            var that = this;
            var aFilePromises = [];

            // Read all selected files
            for (var i = 0; i < aFiles.length; i++) {
                aFilePromises.push(this._readFile(aFiles[i]));
            }

            Promise.all(aFilePromises).then(function (aContents) {
                try {
                    // aContents is array of { name: "filename", content: "xmlString" }
                    // We parse all of them to extract definitions
                    var oJsonTree = that._parseMultipleXsdsToTree(aContents);

                    that.getView().getModel(sModelName).setData(oJsonTree);
                    MessageToast.show(aFiles.length + " XSD(s) Processed Successfully");
                } catch (err) {
                    console.error(err);
                    MessageToast.show("Error parsing XSDs: " + err.message);
                }
            });
        },

        _readFile: function (file) {
            return new Promise(function (resolve, reject) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    resolve({
                        name: file.name,
                        content: e.target.result
                    });
                };
                reader.onerror = reject;
                reader.readAsText(file);
            });
        },

        _parseMultipleXsdsToTree: function (aFileContents) {
            var oParser = new DOMParser();
            var aXmlDocs = [];

            // 1. Parse Strings to DOM
            for (var i = 0; i < aFileContents.length; i++) {
                var oXmlDoc = oParser.parseFromString(aFileContents[i].content, "text/xml");
                var oParseError = oXmlDoc.getElementsByTagName("parsererror");
                if (oParseError.length > 0) {
                    console.error("Error in file: " + aFileContents[i].name, oParseError[0].textContent);
                    // Continue or Throw? Let's throw to warn user
                    throw new Error("Parse Error in " + aFileContents[i].name);
                }
                aXmlDocs.push(oXmlDoc.documentElement);
            }

            // 2. Build Global Registry (Elements and Types) from ALL files
            this._xsdRegistry = {
                elements: {}, // Global elements: <xs:element name="Invoice">
                types: {}     // Global types: <xs:complexType name="InvoiceType">
            };

            for (var j = 0; j < aXmlDocs.length; j++) {
                this._indexGlobalDefinitions(aXmlDocs[j]);
            }

            // 3. Find likely Root Element(s)
            // Heuristic: Elements that are NOT referenced by others? 
            // Or just return ALL global elements determined in the registry?
            // UBL usually has "Invoice", "CreditNote" etc. defined as global elements in the main file.
            // Common components are also global elements.
            // Returning ALL global elements might be too much if there are thousands.
            // Let's rely on the User uploading the "Main" file + dependencies.
            // We can show all Global Elements encountered.

            var rootRoots = [];
            var registryElements = this._xsdRegistry.elements;

            // Convert Registry to Array
            for (var key in registryElements) {
                // Heuristic to avoid clutter: 
                // Only show elements that look like Documents (not in 'common' packages if possible?)
                // Hard to know without file context.
                // Let's show everything for now, user can search/expand.

                // OPTIMIZATION: If we uploaded "UBL-Invoice-2.1.xsd", we probably only want to see "Invoice".
                // But we don't know which file is main.
                // Let's just process all of them.

                var elNode = registryElements[key];
                var result = this._processXsdNode(elNode); // visitedTypes resets here
                if (result) {
                    if (Array.isArray(result)) rootRoots = rootRoots.concat(result);
                    else rootRoots.push(result);
                }
            }

            // Sort roots by name
            rootRoots.sort(function (a, b) { return a.name.localeCompare(b.name); });

            return rootRoots;
        },

        _indexGlobalDefinitions: function (node) {
            // Expects <schema> node or similar root
            if (node.childNodes) {
                for (var i = 0; i < node.childNodes.length; i++) {
                    var child = node.childNodes[i];
                    if (child.nodeType !== 1) continue;

                    var localName = child.nodeName.split(':').pop();
                    var name = child.getAttribute("name");

                    if (name) {
                        if (localName === "element") {
                            this._xsdRegistry.elements[name] = child;
                        } else if (localName === "complexType" || localName === "simpleType") {
                            this._xsdRegistry.types[name] = child;
                        }
                    }
                }
            }
        },

        _processXsdNode: function (xmlNode, visitedTypes) {
            if (!visitedTypes) visitedTypes = [];

            var nodeName = xmlNode.nodeName;
            var localName = nodeName.split(':').pop();

            // 1. ELEMENT
            if (localName === "element") {
                var name = xmlNode.getAttribute("name");
                var ref = xmlNode.getAttribute("ref");
                var type = xmlNode.getAttribute("type");

                // Case A: Reference to Global Element (<xs:element ref="cac:Party">)
                if (!name && ref) {
                    var refName = ref.split(':').pop();

                    // Prevent infinite recursion on self-reference (though rare for elements direct ref)
                    if (visitedTypes.indexOf("REF:" + refName) !== -1) return null;

                    var globalEl = this._xsdRegistry.elements[refName];
                    if (globalEl) {
                        var newVisited = visitedTypes.slice();
                        newVisited.push("REF:" + refName);
                        // Process the GLOBAL ELEMENT definition
                        // It will have name="Party" and likely type="PartyType"
                        return this._processXsdNode(globalEl, newVisited);
                    } else {
                        // Not found in registry (missing file?)
                        // User requested graceful handling: assume it exists but we don't know the structure.
                        return {
                            name: refName, // Just show the name
                            // nodes: [] // No children known
                        };
                    }
                }

                var oItem = {
                    name: name || "Un-named",
                    nodes: []
                };

                var hasInline = false;

                // Process Inline Children
                if (xmlNode.childNodes && xmlNode.childNodes.length > 0) {
                    for (var i = 0; i < xmlNode.childNodes.length; i++) {
                        var child = xmlNode.childNodes[i];
                        if (child.nodeType === 1) {
                            var subNodes = this._processXsdNode(child, visitedTypes);
                            if (Array.isArray(subNodes)) {
                                if (subNodes.length > 0) {
                                    oItem.nodes = oItem.nodes.concat(subNodes);
                                    hasInline = true;
                                }
                            } else if (subNodes) {
                                oItem.nodes.push(subNodes);
                                hasInline = true;
                            }
                        }
                    }
                }

                // Process Type Attribute
                if (!hasInline && type) {
                    var typeName = type.split(':').pop();
                    // Skip standard types
                    if (typeName.indexOf("xs:") === -1 && typeName !== "string" && typeName !== "int" && typeName !== "date" && typeName !== "boolean" && typeName !== "decimal") {
                        if (visitedTypes.indexOf(typeName) === -1) {
                            var typeNode = this._xsdRegistry.types[typeName];
                            if (typeNode) {
                                var newVisited = visitedTypes.slice();
                                newVisited.push(typeName);

                                var typeChildren = this._processXsdNode(typeNode, newVisited);
                                if (Array.isArray(typeChildren)) {
                                    oItem.nodes = oItem.nodes.concat(typeChildren);
                                } else if (typeChildren) {
                                    oItem.nodes.push(typeChildren);
                                }
                            } else {
                                // Type not found in registry (missing file?)
                                // Graceful fallback: we can't expand it, but we don't show an error.
                                // oItem.nodes.push({ name: "Unresolved Type: " + typeName });
                                // Actually, if we can't find the type, we just don't add children.
                                // The node 'oItem' with 'name' (from attribute) already exists.
                                // We just stop recursion here.
                            }
                        } else {
                            // Circular reference detected for type
                            oItem.nodes.push({ name: "Circular Ref: " + typeName });
                        }
                    }
                }

                if (oItem.nodes.length === 0) delete oItem.nodes;
                return oItem;
            }

            // 2. ATTRIBUTE
            if (localName === "attribute") {
                var attrName = xmlNode.getAttribute("name");
                var attrRef = xmlNode.getAttribute("ref");

                if (!attrName && attrRef) attrName = attrRef.split(':').pop();

                if (attrName) {
                    return { name: "@" + attrName };
                }
                return null;
            }

            // 3. CONTAINER / TYPE DEFINITION
            if (["schema", "complexType", "sequence", "all", "choice", "complexContent", "extension", "simpleContent"].indexOf(localName) !== -1) {
                var collectedChildren = [];

                // Extension base
                if (localName === "extension") {
                    var base = xmlNode.getAttribute("base");
                    if (base) {
                        var baseName = base.split(':').pop();
                        // Note: Extension base is usually a TYPE
                        if (visitedTypes.indexOf(baseName) === -1) {
                            var baseNode = this._xsdRegistry.types[baseName];
                            if (baseNode) {
                                var extVisited = visitedTypes.slice();
                                extVisited.push(baseName);
                                var baseChildren = this._processXsdNode(baseNode, extVisited);
                                if (Array.isArray(baseChildren)) collectedChildren = collectedChildren.concat(baseChildren);
                            }
                        }
                    }
                }

                if (xmlNode.childNodes && xmlNode.childNodes.length > 0) {
                    for (var j = 0; j < xmlNode.childNodes.length; j++) {
                        var childContainer = xmlNode.childNodes[j];
                        if (childContainer.nodeType === 1) {
                            var childResult = this._processXsdNode(childContainer, visitedTypes);
                            if (Array.isArray(childResult)) {
                                collectedChildren = collectedChildren.concat(childResult);
                            } else if (childResult) {
                                collectedChildren.push(childResult);
                            }
                        }
                    }
                }
                return collectedChildren;
            }

            return null;
        },


        // --- Mapping & Drawing Logic ---

        onDragStart: function (oEvent) {
            var oDragSession = oEvent.getParameter("dragSession");
            var oDraggedItem = oEvent.getParameter("target");

            // Store the dragged control for later
            oDragSession.setComplexData("draggedItem", oDraggedItem);
        },

        onDrop: function (oEvent) {
            var oDragSession = oEvent.getParameter("dragSession");
            var oDroppedItem = oEvent.getParameter("droppedControl");
            var oDraggedItem = oDragSession.getComplexData("draggedItem");

            if (oDraggedItem && oDroppedItem) {
                // Determine Source and Target (Dragged is Source, Dropped is Target -- usually)
                // But D&D can be configured both ways. 
                // In our View, we only added DragInfo to Source and DropInfo to Target,
                // so Dragged = Source, Dropped = Target.

                // VALIDATION LOGIC
                // Get the data objects bound to the items
                var oSourceData = oDraggedItem.getBindingContext("sourceModel") ? oDraggedItem.getBindingContext("sourceModel").getObject() : null;
                var oTargetData = oDroppedItem.getBindingContext("targetModel") ? oDroppedItem.getBindingContext("targetModel").getObject() : null;

                if (oSourceData && oTargetData) {
                    var bSourceIsStructure = oSourceData.nodes && oSourceData.nodes.length > 0;
                    var bTargetIsStructure = oTargetData.nodes && oTargetData.nodes.length > 0;

                    if (bSourceIsStructure !== bTargetIsStructure) {
                        MessageToast.show("Invalid Mapping: Mismatch between Field and Structure.");
                        return; // Stop mapping
                    }
                }

                this.selectedSourceNode = oDraggedItem;
                this.selectedTargetNode = oDroppedItem;
                this._tryCreateMapping();
            }
        },

        /* Deprecated click handlers for mapping (or kept as alternative?) 
           Let's keep them disabled or repurpose for selection highlighting only.
        */
        onSourceNodeSelect: function (oEvent) {
            // Optional: Highlight
        },

        onTargetNodeSelect: function (oEvent) {
            // Optional: Highlight
        },

        _tryCreateMapping: function () {
            if (this.selectedSourceNode && this.selectedTargetNode) {
                // Both selected! Create a mapping line.
                // In a real implementation:
                // 1. Get coordinates of source item (right edge).
                // 2. Get coordinates of target item (left edge).
                // 3. Draw SVG line.

                this._drawConnectingLine(this.selectedSourceNode, this.selectedTargetNode);

                // Clear selection or keep it? 
                // Let's keep selection visual but maybe reset internal refs if we want unique pairs per click?
                // For now, let's just log it.
                MessageToast.show("Mapped: " + this.selectedSourceNode.getTitle() + " -> " + this.selectedTargetNode.getTitle());

                // Reset for next pair? Or allow re-linking?
                // this.selectedSourceNode.setSelected(false); // Can't easily deselect standard tree item programmatically like this without model update or list API

                // For the MVP, we just draw.
            }
        },

        _drawConnectingLine: function (oSourceItem, oTargetItem) {
            // Get DOM elements
            // Note: This relies on the items being rendered and present in DOM.
            var $source = oSourceItem.$();
            var $target = oTargetItem.$();

            if ($source.length === 0 || $target.length === 0) return;

            // Canvas/Container info
            // The overlay is now "mappingOverlay" or "svgOverlay" directly
            var svg = document.getElementById("svgOverlay");
            var canvasDiv = document.getElementById("mappingOverlay");

            if (!svg || !canvasDiv) return;

            var canvasRect = canvasDiv.getBoundingClientRect(); // Should match viewport/page mostly
            var sourceRect = $source[0].getBoundingClientRect();
            var targetRect = $target[0].getBoundingClientRect();

            // Calculate coordinates relative to the SVG container
            // Start from Source Right Edge, Center Vertical
            var x1 = sourceRect.right - canvasRect.left;
            var y1 = (sourceRect.top + sourceRect.height / 2) - canvasRect.top;

            // End at Target Left Edge, Center Vertical
            var x2 = targetRect.left - canvasRect.left;
            var y2 = (targetRect.top + targetRect.height / 2) - canvasRect.top;

            // Create SVG Path
            var newLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            // Bezier curve for smooth connector
            var dStr = "M" + x1 + "," + y1 + " C" + (x1 + 50) + "," + y1 + " " + (x2 - 50) + "," + y2 + " " + x2 + "," + y2;

            newLine.setAttribute('d', dStr);
            newLine.setAttribute('stroke', '#007aff');
            newLine.setAttribute('stroke-width', '4');
            newLine.setAttribute('stroke-opacity', '0.6');
            newLine.setAttribute('fill', 'none');

            svg.appendChild(newLine);
        }

    });
});
