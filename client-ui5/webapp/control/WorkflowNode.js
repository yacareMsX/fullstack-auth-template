sap.ui.define([
    "sap/ui/core/Control"
], function (Control) {
    "use strict";

    return Control.extend("invoice.app.control.WorkflowNode", {
        metadata: {
            properties: {
                x: { type: "float", defaultValue: 0 },
                y: { type: "float", defaultValue: 0 },
                nodeType: { type: "string", defaultValue: "TASK" }, // START, TASK, DECISION, END
                width: { type: "sap.ui.core.CSSSize", defaultValue: "auto" },
                height: { type: "sap.ui.core.CSSSize", defaultValue: "auto" }
            },
            aggregations: {
                content: { type: "sap.ui.core.Control", multiple: true, singularName: "content" }
            },
            events: {
                positionChange: {
                    parameters: {
                        x: { type: "float" },
                        y: { type: "float" }
                    }
                },
                connectStart: {
                    parameters: {
                        x: { type: "float" },
                        y: { type: "float" }
                    }
                },
                connectEnd: {
                    parameters: {}
                }
            },
            defaultAggregation: "content"
        },

        init: function () {
            this._fnOnMouseMove = this._onMouseMove.bind(this);
            this._fnOnMouseUp = this._onMouseUp.bind(this);
        },

        renderer: function (oRm, oControl) {
            var sType = (oControl.getNodeType() || "TASK").toUpperCase();
            console.log("Rendering Node Type:", sType);

            oRm.openStart("div", oControl);
            oRm.class("workflowNode");
            oRm.style("position", "absolute");
            oRm.style("left", oControl.getX() + "px");
            oRm.style("top", oControl.getY() + "px");
            oRm.style("width", oControl.getWidth());
            oRm.style("height", oControl.getHeight());
            oRm.style("z-index", "10"); // Ensure it's above grid
            oRm.openEnd();

            // Input Port (Left) - Not for START
            if (sType !== "START") {
                oRm.openStart("div");
                oRm.class("port-in");
                oRm.style("position", "absolute");
                oRm.style("left", "-6px");
                oRm.style("top", "50%");
                oRm.style("transform", "translateY(-50%)");
                oRm.style("width", "12px");
                oRm.style("height", "12px");
                oRm.style("background-color", "white");
                oRm.style("border", "2px solid #0070f2");
                oRm.style("border-radius", "50%");
                oRm.style("cursor", "crosshair");
                oRm.style("z-index", "11");
                oRm.openEnd();
                oRm.close("div");
            }

            // Content
            var aContent = oControl.getContent();
            for (var i = 0; i < aContent.length; i++) {
                oRm.renderControl(aContent[i]);
            }

            // Output Port (Right) - Not for END
            if (sType !== "END") {
                oRm.openStart("div");
                oRm.class("port-out");
                oRm.style("position", "absolute");
                oRm.style("right", "-6px");
                oRm.style("top", "50%");
                oRm.style("transform", "translateY(-50%)");
                oRm.style("width", "12px");
                oRm.style("height", "12px");
                oRm.style("background-color", "white");
                oRm.style("border", "2px solid #0070f2");
                oRm.style("border-radius", "50%");
                oRm.style("cursor", "crosshair");
                oRm.style("z-index", "11");
                oRm.openEnd();
                oRm.close("div");
            }

            oRm.close("div");
        },

        onAfterRendering: function () {
            var oDomRef = this.getDomRef();
            if (oDomRef) {
                oDomRef.addEventListener("mousedown", this._onMouseDown.bind(this));
                oDomRef.style.cursor = "move";

                // Port listeners
                var oPortOut = oDomRef.querySelector(".port-out");
                if (oPortOut) {
                    oPortOut.addEventListener("mousedown", this._onPortMouseDown.bind(this));
                }

                var oPortIn = oDomRef.querySelector(".port-in");
                if (oPortIn) {
                    oPortIn.addEventListener("mouseup", this._onPortMouseUp.bind(this));
                }
            }
        },

        _onPortMouseDown: function (oEvent) {
            oEvent.stopPropagation(); // Prevent node drag
            oEvent.preventDefault();

            // Calculate absolute position of the port
            var oRect = oEvent.target.getBoundingClientRect();
            var oContainer = this.getParent().getDomRef();
            var oContainerRect = oContainer.getBoundingClientRect();

            // Find scroll container
            var oScrollContent = oContainer.querySelector(".sapMScrollContScroll");
            var fScrollLeft = oScrollContent ? oScrollContent.scrollLeft : 0;
            var fScrollTop = oScrollContent ? oScrollContent.scrollTop : 0;

            // Relative to container
            var fX = oRect.left - oContainerRect.left + (oRect.width / 2) + fScrollLeft;
            var fY = oRect.top - oContainerRect.top + (oRect.height / 2) + fScrollTop;

            console.log("Connect Start:", fX, fY);

            this.fireConnectStart({
                x: fX,
                y: fY
            });
        },

        _onPortMouseUp: function (oEvent) {
            oEvent.stopPropagation();
            this.fireConnectEnd();
        },

        _onMouseDown: function (oEvent) {
            // Prevent dragging if clicking on input fields or buttons inside (optional, but good for UX)
            // For now, we allow dragging from anywhere in the node container

            oEvent.preventDefault(); // Prevent text selection

            this._startX = oEvent.clientX;
            this._startY = oEvent.clientY;
            this._startLeft = this.getX();
            this._startTop = this.getY();

            document.addEventListener("mousemove", this._fnOnMouseMove);
            document.addEventListener("mouseup", this._fnOnMouseUp);
        },

        _onMouseMove: function (oEvent) {
            var dx = oEvent.clientX - this._startX;
            var dy = oEvent.clientY - this._startY;

            var newX = this._startLeft + dx;
            var newY = this._startTop + dy;

            // Snap to grid (optional, e.g., 20px)
            newX = Math.round(newX / 20) * 20;
            newY = Math.round(newY / 20) * 20;

            // Update DOM directly for performance
            var oDomRef = this.getDomRef();
            if (oDomRef) {
                oDomRef.style.left = newX + "px";
                oDomRef.style.top = newY + "px";
            }

            // Store temporary position
            this._currentX = newX;
            this._currentY = newY;
        },

        _onMouseUp: function (oEvent) {
            document.removeEventListener("mousemove", this._fnOnMouseMove);
            document.removeEventListener("mouseup", this._fnOnMouseUp);

            // Update properties and fire event
            if (this._currentX !== undefined && (this._currentX !== this.getX() || this._currentY !== this.getY())) {
                this.setProperty("x", this._currentX, true); // true to suppress rerendering
                this.setProperty("y", this._currentY, true);

                this.firePositionChange({
                    x: this._currentX,
                    y: this._currentY
                });
            }
        }
    });
});
