sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Button",
    "sap/m/Text",
    "sap/ui/layout/VerticalLayout",
    "invoice/app/control/WorkflowNode",
    "sap/m/Dialog",
    "sap/m/Label",
    "sap/m/Input"
], function (Controller, JSONModel, MessageToast, MessageBox, Button, Text, VerticalLayout, WorkflowNode, Dialog, Label, Input) {
    "use strict";

    return Controller.extend("invoice.app.controller.WorkflowDesigner", {

        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("workflowDesigner").attachPatternMatched(this._onRouteMatched, this);
            oRouter.getRoute("workflowNew").attachPatternMatched(this._onNewWorkflow, this);

            // Model for the workflow being edited
            var oModel = new JSONModel({
                id: null,
                name: "New Workflow",
                description: "",
                is_active: false,
                nodes: [],
                edges: []
            });
            this.getView().setModel(oModel, "workflow");

            // Model for the selected node properties
            var oSelectedNodeModel = new JSONModel({});
            this.getView().setModel(oSelectedNodeModel, "selectedNode");

            // Model for view state
            var oViewModel = new JSONModel({
                isConnectMode: false, // Legacy, can be removed or kept for other purposes
                connectingNodeId: null
            });
            this.getView().setModel(oViewModel, "view");

            // Global mouse move for temp connection line
            this._fnOnDocMouseMove = this._onDocMouseMove.bind(this);
            this._fnOnDocMouseUp = this._onDocMouseUp.bind(this);

            // Ensure edges are rendered after view is fully in DOM
            this.getView().addEventDelegate({
                onAfterRendering: function () {
                    var oModel = this.getView().getModel("workflow");
                    if (oModel) {
                        var aEdges = oModel.getProperty("/edges");
                        if (aEdges && aEdges.length > 0) {
                            this._renderEdges(aEdges);
                        }
                    }
                }.bind(this)
            });
        },

        _createNodeControl: function (node) {
            var that = this;
            var oContainer = this.getView().byId("canvasContainer");

            // Create the content for the node (the visual part)
            var oNodeContent = new VerticalLayout({
                width: "150px",
                content: [
                    new Button({
                        text: node.label,
                        icon: that._getIconForType(node.type),
                        type: that._getTypeForType(node.type),
                        width: "100%",
                        press: function () {
                            that._onNodeSelect(node);
                        }
                    })
                ]
            });

            // Create the wrapper custom control for positioning
            var oWorkflowNode = new WorkflowNode({
                x: node.position.x || 0,
                y: node.position.y || 0,
                type: node.type, // Pass type to render correct ports
                content: [oNodeContent],
                positionChange: function (oEvent) {
                    var iNewX = oEvent.getParameter("x");
                    var iNewY = oEvent.getParameter("y");

                    // Update model
                    var oModel = that.getView().getModel("workflow");
                    var aNodes = oModel.getProperty("/nodes");
                    var oTargetNode = aNodes.find(n => n.id === node.id);
                    if (oTargetNode) {
                        oTargetNode.position = { x: iNewX, y: iNewY };
                        that._renderEdges(oModel.getProperty("/edges"));
                    }
                },
                connectStart: function (oEvent) {
                    that._onConnectStart(node.id, oEvent.getParameter("x"), oEvent.getParameter("y"));
                },
                connectEnd: function (oEvent) {
                    that._onConnectEnd(node.id);
                }
            });

            // Add custom data to identify the node
            oWorkflowNode.addCustomData(new sap.ui.core.CustomData({
                key: "nodeId",
                value: node.id
            }));

            oContainer.addContent(oWorkflowNode);
        },

        _onConnectStart: function (sNodeId, fX, fY) {
            this._ensureSvgLayer();

            // Raise SVG z-index to allow drawing over nodes while dragging
            var oSvg = document.getElementById("workflowConnections");
            if (oSvg) {
                oSvg.style.zIndex = "20";
            }

            this._sConnectingSourceId = sNodeId;
            this._fConnectStartX = fX;
            this._fConnectStartY = fY;

            document.addEventListener("mousemove", this._fnOnDocMouseMove);
            document.addEventListener("mouseup", this._fnOnDocMouseUp);
        },

        _onConnectEnd: function (sTargetNodeId) {
            if (this._sConnectingSourceId && this._sConnectingSourceId !== sTargetNodeId) {
                this._createConnection(this._sConnectingSourceId, sTargetNodeId);
            }
            this._stopConnectionDrag();
        },

        _onDocMouseMove: function (oEvent) {
            if (!this._sConnectingSourceId) return;

            var oContainer = this.getView().byId("canvasContainer");
            var oRect = oContainer.getDomRef().getBoundingClientRect();
            var oScrollContent = oContainer.getDomRef().querySelector(".sapMScrollContScroll");

            // Need to account for scroll position
            var fScrollLeft = oScrollContent ? oScrollContent.scrollLeft : 0;
            var fScrollTop = oScrollContent ? oScrollContent.scrollTop : 0;

            // Calculate mouse position relative to canvas (including scroll)
            var fMouseX = oEvent.clientX - oRect.left + fScrollLeft;
            var fMouseY = oEvent.clientY - oRect.top + fScrollTop;

            this._drawTempLine(this._fConnectStartX, this._fConnectStartY, fMouseX, fMouseY);
        },

        _onDocMouseUp: function (oEvent) {
            this._stopConnectionDrag();
        },

        _stopConnectionDrag: function () {
            this._sConnectingSourceId = null;
            document.removeEventListener("mousemove", this._fnOnDocMouseMove);
            document.removeEventListener("mouseup", this._fnOnDocMouseUp);

            // Reset SVG z-index
            var oSvg = document.getElementById("workflowConnections");
            if (oSvg) {
                oSvg.style.zIndex = "1";

                // Remove temp line
                var oTempLine = document.getElementById("tempConnectionLine");
                if (oTempLine) {
                    oSvg.removeChild(oTempLine);
                }
            }
        },

        _drawTempLine: function (x1, y1, x2, y2) {
            var oSvg = document.getElementById("workflowConnections");
            if (!oSvg) return;

            var oPath = document.getElementById("tempConnectionLine");
            if (!oPath) {
                oPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
                oPath.setAttribute("id", "tempConnectionLine");
                oPath.setAttribute("stroke", "#0070f2");
                oPath.setAttribute("stroke-width", "2");
                oPath.setAttribute("stroke-dasharray", "5,5"); // Dashed line
                oPath.setAttribute("fill", "none");
                oPath.setAttribute("marker-end", "url(#arrowhead)");
                oSvg.appendChild(oPath);
            }

            // Bezier curve
            var d = `M ${x1} ${y1} C ${x1 + 50} ${y1}, ${x2 - 50} ${y2}, ${x2} ${y2}`;
            oPath.setAttribute("d", d);
        },

        _onNewWorkflow: function () {
            var oModel = this.getView().getModel("workflow");
            oModel.setData({
                id: null,
                name: "New Workflow",
                description: "",
                is_active: false,
                nodes: [],
                edges: []
            });
            this._clearCanvas();
        },

        _onRouteMatched: function (oEvent) {
            var sWorkflowId = oEvent.getParameter("arguments").workflowId;
            this._loadWorkflow(sWorkflowId);
        },

        _loadWorkflow: function (sId) {
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            fetch("http://localhost:3000/api/workflows/" + sId, {
                headers: { "Authorization": "Bearer " + sToken }
            })
                .then(res => res.json())
                .then(data => {
                    var oModel = that.getView().getModel("workflow");
                    oModel.setData(data);
                    that._renderGraph(data.nodes, data.edges);
                })
                .catch(err => {
                    console.error("Error loading workflow:", err);
                    MessageToast.show("Error loading workflow");
                });
        },

        _clearCanvas: function () {
            var oContainer = this.getView().byId("canvasContainer");
            oContainer.destroyContent();
            this.getView().getModel("selectedNode").setData({});
            // Clear SVG paths
            var oSvg = document.getElementById("workflowConnections");
            if (oSvg) {
                while (oSvg.firstChild) {
                    oSvg.removeChild(oSvg.firstChild);
                }
            }
        },

        _renderGraph: function (nodes, edges) {
            this._clearCanvas();
            var that = this;

            if (nodes) {
                nodes.forEach(function (node) {
                    that._createNodeControl(node);
                });
            }

            // Render edges
            if (edges && edges.length > 0) {
                // Use setTimeout to allow DOM to update after nodes are added
                setTimeout(function () {
                    that._renderEdges(edges);
                }, 200);
            }
        },

        _renderEdges: function (edges) {
            this._ensureSvgLayer();
            var oSvg = document.getElementById("workflowConnections");
            if (!oSvg) return;

            // Clear existing paths
            while (oSvg.firstChild) {
                oSvg.removeChild(oSvg.firstChild);
            }

            // Define arrow marker
            var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
            var marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
            marker.setAttribute("id", "arrowhead");
            marker.setAttribute("markerWidth", "10");
            marker.setAttribute("markerHeight", "7");
            marker.setAttribute("refX", "9");
            marker.setAttribute("refY", "3.5");
            marker.setAttribute("orient", "auto");

            var polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
            polygon.setAttribute("fill", "#0070f2");

            marker.appendChild(polygon);
            defs.appendChild(marker);
            oSvg.appendChild(defs);

            if (!edges) return;

            var oModel = this.getView().getModel("workflow");
            var aNodes = oModel.getProperty("/nodes");

            edges.forEach(function (edge) {
                var sourceNode = aNodes.find(n => n.id === edge.source_node_id);
                var targetNode = aNodes.find(n => n.id === edge.target_node_id);

                if (sourceNode && targetNode) {
                    this._drawEdge(oSvg, sourceNode, targetNode, edge.id);
                }
            }.bind(this));
        },

        _ensureSvgLayer: function () {
            var oContainer = this.getView().byId("canvasContainer");
            if (!oContainer) return;

            var oDomRef = oContainer.getDomRef();
            if (!oDomRef) return;

            // Find the scrollable content div
            var oScrollContent = oDomRef.querySelector(".sapMScrollContScroll");
            if (!oScrollContent) return;

            var oSvg = document.getElementById("workflowConnections");
            if (!oSvg) {
                oSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                oSvg.setAttribute("id", "workflowConnections");
                oSvg.setAttribute("width", "2000");
                oSvg.setAttribute("height", "2000");
                oSvg.style.position = "absolute";
                oSvg.style.top = "0";
                oSvg.style.left = "0";
                oSvg.style.pointerEvents = "none";
                oSvg.style.zIndex = "1"; // Below nodes (z-index 10)

                // Prepend to ensure it's behind content if z-index fails context
                if (oScrollContent.firstChild) {
                    oScrollContent.insertBefore(oSvg, oScrollContent.firstChild);
                } else {
                    oScrollContent.appendChild(oSvg);
                }
            }
        },

        _drawEdge: function (svg, source, target, edgeId) {
            var path = document.createElementNS("http://www.w3.org/2000/svg", "path");

            // Calculate connection points based on side ports
            // Source (Output): Right side
            // Target (Input): Left side
            // Node Width: 150px
            // Node Height: ~50px (Button + Padding). Center Y ~ 25px

            var startX = (source.position.x || 0) + 150; // Right edge
            var startY = (source.position.y || 0) + 25;  // Vertical center
            var endX = (target.position.x || 0);         // Left edge
            var endY = (target.position.y || 0) + 25;    // Vertical center

            // Horizontal Bezier curve (S-shape)
            var d = `M ${startX} ${startY} C ${startX + 50} ${startY}, ${endX - 50} ${endY}, ${endX} ${endY}`;

            path.setAttribute("d", d);
            path.setAttribute("id", "edge-" + edgeId); // Add ID for selection
            path.setAttribute("stroke", "#0070f2"); // SAP Blue for visibility
            path.setAttribute("stroke-width", "3");
            path.setAttribute("fill", "none");
            path.setAttribute("marker-end", "url(#arrowhead)");
            path.style.cursor = "pointer"; // Indicate clickable

            // Click handler for selection
            var that = this;
            path.addEventListener("click", function (e) {
                e.stopPropagation();
                that._onEdgeSelect(edgeId);
            });

            svg.appendChild(path);
        },

        _onEdgeSelect: function (edgeId) {
            var oViewModel = this.getView().getModel("view");
            var sCurrentSelected = oViewModel.getProperty("/selectedEdgeId");

            // Deselect previous
            if (sCurrentSelected) {
                var oPrevPath = document.getElementById("edge-" + sCurrentSelected);
                if (oPrevPath) {
                    oPrevPath.setAttribute("stroke", "#0070f2");
                    oPrevPath.setAttribute("stroke-width", "3");
                }
            }

            // Select new
            oViewModel.setProperty("/selectedEdgeId", edgeId);
            oViewModel.setProperty("/selectedNodeId", null); // Deselect node
            this.getView().getModel("selectedNode").setData({}); // Clear node properties

            var oPath = document.getElementById("edge-" + edgeId);
            if (oPath) {
                oPath.setAttribute("stroke", "#ff0000"); // Red for selection
                oPath.setAttribute("stroke-width", "4");
            }
        },

        onDeleteConnection: function () {
            var oViewModel = this.getView().getModel("view");
            var sEdgeId = oViewModel.getProperty("/selectedEdgeId");

            if (!sEdgeId) return;

            var oModel = this.getView().getModel("workflow");
            var aEdges = oModel.getProperty("/edges");

            var aNewEdges = aEdges.filter(e => e.id !== sEdgeId);
            oModel.setProperty("/edges", aNewEdges);

            oViewModel.setProperty("/selectedEdgeId", null);
            this._renderEdges(aNewEdges);
        },

        _createNodeControl: function (node) {
            var that = this;
            var oContainer = this.getView().byId("canvasContainer");

            // Create the content for the node (the visual part)
            var oNodeContent = new VerticalLayout({
                width: "150px",
                content: [
                    new Button({
                        text: node.label,
                        icon: that._getIconForType(node.type),
                        type: that._getTypeForType(node.type),
                        width: "100%",
                        press: function () {
                            that._onNodePress(node);
                        }
                    })
                ]
            });

            // Create the wrapper custom control for positioning
            var oWorkflowNode = new WorkflowNode({
                x: node.position.x || 0,
                y: node.position.y || 0,
                nodeType: node.type, // Pass type to render correct ports (renamed property)
                content: [oNodeContent],
                positionChange: function (oEvent) {
                    var iNewX = oEvent.getParameter("x");
                    var iNewY = oEvent.getParameter("y");

                    // Update model
                    var oModel = that.getView().getModel("workflow");
                    var aNodes = oModel.getProperty("/nodes");
                    var oTargetNode = aNodes.find(n => n.id === node.id);
                    if (oTargetNode) {
                        oTargetNode.position = { x: iNewX, y: iNewY };
                        that._renderEdges(oModel.getProperty("/edges"));
                    }
                },
                connectStart: function (oEvent) {
                    that._onConnectStart(node.id, oEvent.getParameter("x"), oEvent.getParameter("y"));
                },
                connectEnd: function (oEvent) {
                    that._onConnectEnd(node.id);
                }
            });

            // Add custom data to identify the node
            oWorkflowNode.addCustomData(new sap.ui.core.CustomData({
                key: "nodeId",
                value: node.id
            }));

            oContainer.addContent(oWorkflowNode);
        },

        _getIconForType: function (type) {
            switch (type) {
                case "START": return "sap-icon://begin";
                case "TASK": return "sap-icon://activity-items";
                case "DECISION": return "sap-icon://decision";
                case "END": return "sap-icon://end";
                default: return "sap-icon://circle-task";
            }
        },

        _getTypeForType: function (type) {
            switch (type) {
                case "START": return "Accept";
                case "END": return "Reject";
                case "DECISION": return "Attention";
                default: return "Default";
            }
        },

        // Specific handlers for each button type to guarantee correctness
        onAddStart: function () { this._addNode("START"); },
        onAddTask: function () { this._addNode("TASK"); },
        onAddDecision: function () { this._addNode("DECISION"); },
        onAddEnd: function () { this._addNode("END"); },

        // Legacy handler kept but redirects to specific logic if possible
        onAddNode: function (oEvent) {
            // This shouldn't be called if view is updated, but just in case
            var sText = oEvent.getSource().getText();
            if (sText === "Start") this._addNode("START");
            else if (sText === "End") this._addNode("END");
            else if (sText === "Decision") this._addNode("DECISION");
            else this._addNode("TASK");
        },

        _addNode: function (sType) {
            console.log("Adding Node of Type:", sType);

            var oModel = this.getView().getModel("workflow");
            var aNodes = oModel.getProperty("/nodes") || [];

            var newNode = {
                id: crypto.randomUUID(),
                type: sType,
                label: "New " + sType,
                properties: {},
                position: { x: 50 + (aNodes.length * 20), y: 50 + (aNodes.length * 20) }
            };

            aNodes.push(newNode);
            oModel.setProperty("/nodes", aNodes);

            this._createNodeControl(newNode);
        },

        _onNodePress: function (node) {
            var oViewModel = this.getView().getModel("view");
            var bConnectMode = oViewModel.getProperty("/isConnectMode");

            if (bConnectMode) {
                var sSourceId = oViewModel.getProperty("/connectingNodeId");

                if (!sSourceId) {
                    // First click: select source
                    oViewModel.setProperty("/connectingNodeId", node.id);
                    MessageToast.show("Select target node");
                } else {
                    // Second click: select target
                    if (sSourceId === node.id) {
                        MessageToast.show("Cannot connect to itself");
                        oViewModel.setProperty("/connectingNodeId", null);
                        return;
                    }

                    this._createConnection(sSourceId, node.id);
                    oViewModel.setProperty("/connectingNodeId", null);
                }
            } else {
                // Normal selection mode
                this._onNodeSelect(node);
            }
        },

        _createConnection: function (sourceId, targetId) {
            var oModel = this.getView().getModel("workflow");
            var aEdges = oModel.getProperty("/edges") || [];

            // Check if exists
            var bExists = aEdges.some(e => e.source_node_id === sourceId && e.target_node_id === targetId);
            if (bExists) {
                MessageToast.show("Connection already exists");
                return;
            }

            var newEdge = {
                id: crypto.randomUUID(),
                source_node_id: sourceId,
                target_node_id: targetId,
                label: "",
                condition: {}
            };

            aEdges.push(newEdge);
            oModel.setProperty("/edges", aEdges);

            this._renderEdges(aEdges);
            MessageToast.show("Connected!");
        },

        _onNodeSelect: function (node) {
            var oModel = this.getView().getModel("selectedNode");
            // Clone to avoid direct binding issues until save
            oModel.setData(JSON.parse(JSON.stringify(node)));
        },

        onNodeLabelChange: function (oEvent) {
            var sNewLabel = oEvent.getParameter("value");
            var oSelectedModel = this.getView().getModel("selectedNode");
            var sNodeId = oSelectedModel.getProperty("/id");

            // Update main model
            var oWorkflowModel = this.getView().getModel("workflow");
            var aNodes = oWorkflowModel.getProperty("/nodes");
            var oNode = aNodes.find(n => n.id === sNodeId);
            if (oNode) {
                oNode.label = sNewLabel;
                oWorkflowModel.setProperty("/nodes", aNodes);

                // Update visual control text
                // This requires finding the control by ID or re-rendering
                this._renderGraph(aNodes, oWorkflowModel.getProperty("/edges"));
            }
        },

        onDeleteNode: function () {
            var oSelectedModel = this.getView().getModel("selectedNode");
            var sNodeId = oSelectedModel.getProperty("/id");

            if (!sNodeId) return;

            var oModel = this.getView().getModel("workflow");
            var aNodes = oModel.getProperty("/nodes");
            var aEdges = oModel.getProperty("/edges");

            // Remove node
            var aNewNodes = aNodes.filter(n => n.id !== sNodeId);

            // Remove connected edges
            var aNewEdges = aEdges.filter(e => e.source_node_id !== sNodeId && e.target_node_id !== sNodeId);

            oModel.setProperty("/nodes", aNewNodes);
            oModel.setProperty("/edges", aNewEdges);

            // Clear selection
            oSelectedModel.setData({});

            // Re-render
            this._renderGraph(aNewNodes, aNewEdges);
            MessageToast.show("Node deleted");
        },

        onSave: function () {
            var oModel = this.getView().getModel("workflow");
            var sName = oModel.getProperty("/name");

            // Create Dialog
            if (!this._oSaveDialog) {
                this._oSaveDialog = new Dialog({
                    title: "Save Workflow",
                    type: "Message",
                    content: [
                        new Label({ text: "Workflow Name", labelFor: "workflowNameInput" }),
                        new Input("workflowNameInput", {
                            width: "100%",
                            placeholder: "Enter workflow name..."
                        })
                    ],
                    beginButton: new Button({
                        type: "Emphasized",
                        text: "Save",
                        press: function () {
                            var sInputName = sap.ui.getCore().byId("workflowNameInput").getValue();
                            if (!sInputName) {
                                MessageToast.show("Name is required");
                                return;
                            }
                            oModel.setProperty("/name", sInputName);
                            this._performSave();
                            this._oSaveDialog.close();
                        }.bind(this)
                    }),
                    endButton: new Button({
                        text: "Cancel",
                        press: function () {
                            this._oSaveDialog.close();
                        }.bind(this)
                    })
                });
                this.getView().addDependent(this._oSaveDialog);
            }

            // Pre-fill name if it's not the default "New Workflow"
            var oInput = sap.ui.getCore().byId("workflowNameInput");
            if (sName && sName !== "New Workflow") {
                oInput.setValue(sName);
            } else {
                oInput.setValue("");
            }

            this._oSaveDialog.open();
        },

        _performSave: function () {
            var oModel = this.getView().getModel("workflow");
            var oData = oModel.getData();
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            // 1. Create/Update Workflow Metadata
            var sUrl = oData.id
                ? "http://localhost:3000/api/workflows/" + oData.id
                : "http://localhost:3000/api/workflows";
            var sMethod = oData.id ? "PUT" : "POST";

            fetch(sUrl, {
                method: sMethod,
                headers: {
                    "Authorization": "Bearer " + sToken,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: oData.name,
                    description: oData.description,
                    is_active: oData.is_active
                })
            })
                .then(res => {
                    if (!res.ok) throw new Error("Failed to save workflow metadata");
                    return res.json();
                })
                .then(workflowData => {
                    // Update ID if new
                    oModel.setProperty("/id", workflowData.id);

                    console.log("Saving Graph for Workflow:", workflowData.id);
                    console.log("Nodes:", oData.nodes);
                    console.log("Edges:", oData.edges);

                    // 2. Save Graph (Nodes & Edges)
                    return fetch("http://localhost:3000/api/workflows/" + workflowData.id + "/graph", {
                        method: "PUT",
                        headers: {
                            "Authorization": "Bearer " + sToken,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            nodes: oData.nodes,
                            edges: oData.edges
                        })
                    });
                })
                .then(res => {
                    if (!res.ok) return res.json().then(err => { throw new Error(err.error || "Failed to save graph"); });
                    return res.json();
                })
                .then(data => {
                    console.log("Graph saved response:", data);
                    MessageToast.show("Workflow saved successfully");
                })
                .catch(err => {
                    console.error("Error saving workflow:", err);
                    MessageBox.error("Error saving workflow: " + err.message);
                });
        }
    });
});
