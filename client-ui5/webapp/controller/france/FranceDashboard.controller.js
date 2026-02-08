sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "invoice/app/model/formatter",
    "sap/viz/ui5/format/ChartFormatter",
    "sap/viz/ui5/api/env/Format"
], function (Controller, JSONModel, MessageToast, DateFormat, formatter, ChartFormatter, Format) {
    "use strict";

    return Controller.extend("invoice.app.controller.france.FranceDashboard", {

        formatter: formatter,

        onInit: function () {
            // Force Spanish locale for correct number formatting
            sap.ui.getCore().getConfiguration().setLanguage("es-ES");
            sap.ui.getCore().getConfiguration().setFormatLocale("es-ES");

            var oViewModel = new JSONModel({
                kpi: {
                    issuedCount: 0,
                    issuedTrend: "0%",
                    paidPercent: 0,
                    paidTrend: "0%",
                    outstandingPercent: 0,
                    outstandingTrend: "0%",
                    overdueCount: 0,
                    overdueTrend: "0%"
                },
                charts: {
                    revenue: [],
                    status: []
                },
                recentInvoices: []
            });
            this.getView().setModel(oViewModel, "dashboard");

            this._setupVizProperties();

            // Load Data
            this._loadRealData();
        },

        _setupVizProperties: function () {
            var oVizFrameRevenue = this.byId("idVizFrameRevenue");
            var oVizFrameStatus = this.byId("idVizFrameStatus");

            if (oVizFrameRevenue) {
                oVizFrameRevenue.setVizProperties({
                    plotArea: {
                        dataLabel: { visible: true },
                        drawingEffect: "normal", // Flat effect
                        colorPalette: ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#6366f1", "#8b5cf6"]
                    },
                    valueAxis: {
                        title: { visible: false }
                    },
                    categoryAxis: {
                        title: { visible: false }
                    },
                    title: { visible: false }
                });
            }
            if (oVizFrameStatus) {
                oVizFrameStatus.setVizProperties({
                    plotArea: {
                        dataLabel: { visible: true },
                        drawingEffect: "normal", // Flat effect
                        colorPalette: ["#22c55e", "#eab308", "#ef4444"] // Green (Paid), Yellow (Pending), Red (Overdue/Other)
                    },
                    title: { visible: false },
                    legend: { visible: true }
                });
            }
        },

        _loadRealData: function () {
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            fetch("/api/invoices/facturas?invoice_country_id=3", {
                headers: { "Authorization": "Bearer " + sToken }
            })
                .then(r => r.json())
                .then(data => {
                    that._processData(data);
                })
                .catch(err => console.error("Error loading dashboard data", err));
        },

        _processData: function (aInvoices) {
            var oModel = this.getView().getModel("dashboard");

            if (!Array.isArray(aInvoices)) {
                console.error("Data is not an array:", aInvoices);
                return;
            }

            var iTotalCount = aInvoices.length;
            var iPaidCount = 0;
            var iPendingCount = 0;
            var iOverdueCount = 0; // Placeholder logic

            // Mock Trends (randomized for demo as we lack historical data context in this fetch)
            // Real implementation would require fetching previous period data
            var sIssuedTrend = "+" + Math.floor(Math.random() * 20) + "%";
            var sPaidTrend = "+" + Math.floor(Math.random() * 15) + "%";
            var sOutstandingTrend = "-" + Math.floor(Math.random() * 10) + "%";
            var sOverdueTrend = "-" + Math.floor(Math.random() * 5) + "%";


            aInvoices.forEach(inv => {
                var sStatus = inv.estado;
                if (sStatus === 'PAGADA') {
                    iPaidCount++;
                } else if (['PENDIENTE', 'EMITIDA', 'ENVIADA', 'FIRMADA', 'REGISTRADA'].includes(sStatus)) {
                    iPendingCount++;

                    // Determine Overdue (Mock: if outstanding and date < 30 days ago)
                    var dDate = new Date(inv.fecha_emision);
                    var dDue = new Date();
                    dDue.setDate(dDue.getDate() - 30);
                    if (dDate < dDue) {
                        iOverdueCount++;
                    }
                }
            });

            var fPaidPercent = iTotalCount > 0 ? Math.round((iPaidCount / iTotalCount) * 100) : 0;
            var fOutstandingPercent = iTotalCount > 0 ? Math.round((iPendingCount / iTotalCount) * 100) : 0;

            // NEW KPIs for Generic Tiles (matching Spain Dashboard)
            var fTotalRevenue = 0;
            var fOutstandingAmount = 0;

            aInvoices.forEach(inv => {
                var nTotal = this._parseNumber(inv.total);
                fTotalRevenue += nTotal;

                if (['PENDIENTE', 'EMITIDA', 'ENVIADA', 'FIRMADA', 'REGISTRADA'].includes(inv.estado)) {
                    fOutstandingAmount += nTotal;
                }
            });

            var fAverageTicket = iTotalCount > 0 ? fTotalRevenue / iTotalCount : 0;

            oModel.setProperty("/kpi", {
                // Legacy (kept for charts if needed, or remove if unused)
                issuedCount: iTotalCount,
                issuedTrend: sIssuedTrend,
                paidPercent: fPaidPercent,
                paidTrend: sPaidTrend,
                outstandingPercent: fOutstandingPercent,
                outstandingTrend: sOutstandingTrend,
                overdueCount: iOverdueCount,
                overdueTrend: sOverdueTrend,

                // New Tile Metrics
                totalRevenue: fTotalRevenue,
                totalCount: iTotalCount,
                outstandingAmount: fOutstandingAmount,
                averageTicket: fAverageTicket
            });

            // 2. Charts - Revenue by Month (Last 6 Months)
            var oRevenueByMonth = {};
            var oDateFormat = DateFormat.getDateInstance({ pattern: "MMM" });
            // Using MMM for chart labels

            // Initialize last 6 months keys to ensure order
            var aMonths = [];
            for (var i = 5; i >= 0; i--) {
                var d = new Date();
                d.setMonth(d.getMonth() - i);
                var sKey = oDateFormat.format(d);
                aMonths.push(sKey);
                oRevenueByMonth[sKey] = 0;
            }

            aInvoices.forEach(inv => {
                if (inv.fecha_emision) {
                    var dDate = new Date(inv.fecha_emision);
                    var sKey = oDateFormat.format(dDate);
                    // Only count if it falls in our last 6 months window (roughly)
                    if (oRevenueByMonth.hasOwnProperty(sKey)) {
                        oRevenueByMonth[sKey] += this._parseNumber(inv.total);
                    }
                }
            });

            var aRevenueChart = aMonths.map(month => ({
                month: month,
                revenue: oRevenueByMonth[month]
            }));
            oModel.setProperty("/charts/revenue", aRevenueChart);

            // 3. Charts - Status Distribution
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            var oStatusCount = {};

            aInvoices.forEach(inv => {
                var sStatus = inv.estado || "UNKNOWN";
                oStatusCount[sStatus] = (oStatusCount[sStatus] || 0) + 1;
            });

            var aStatusChart = Object.keys(oStatusCount).map(key => {
                // Map known statuses to i18n keys if available, else keep key
                var sLabel = key;
                if (key === 'BORRADOR') sLabel = oResourceBundle.getText("statusDraft");
                else if (key === 'EMITIDA') sLabel = oResourceBundle.getText("statusIssued");
                else if (key === 'ENVIADA') sLabel = oResourceBundle.getText("statusSent");
                else if (key === 'PAGADA') sLabel = oResourceBundle.getText("statusPaid");
                else if (key === 'PENDIENTE') sLabel = oResourceBundle.getText("statusPending");
                else if (key === 'CANCELADA') sLabel = "Cancelada"; // Add Key if missing

                return {
                    status: sLabel,
                    count: oStatusCount[key]
                };
            });
            oModel.setProperty("/charts/status", aStatusChart);

            // 4. Recent Invoices (Last 5)
            var aSorted = aInvoices.sort((a, b) => {
                return new Date(b.fecha_emision) - new Date(a.fecha_emision);
            });
            var aRecent = aSorted.slice(0, 5).map(inv => {
                inv.fecha_emision = new Date(inv.fecha_emision);
                return inv;
            });
            oModel.setProperty("/recentInvoices", aRecent);
        },

        _parseNumber: function (vValue) {
            if (!vValue) return 0;
            if (typeof vValue === 'number') return vValue;

            var sValue = vValue.toString();
            if (sValue.includes('.') && sValue.includes(',')) {
                sValue = sValue.replace(/\./g, '').replace(',', '.');
            } else if (sValue.includes(',') && !sValue.includes('.')) {
                sValue = sValue.replace(',', '.');
            } else if (sValue.includes('.') && sValue.indexOf('.') === sValue.lastIndexOf('.') && sValue.length - sValue.indexOf('.') === 4) {
                sValue = sValue.replace(/\./g, '');
            }
            return parseFloat(sValue) || 0;
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("home");
        },

        onNavToInvoiceDetail: function (oEvent) {
            var oItem = oEvent.getSource();
            // Source could be button or list item. Walk up to column list item if needed, but binding context propagates
            var oContext = oItem.getBindingContext("dashboard");
            var sInvoiceId = oContext.getProperty("id_factura");

            this.getOwnerComponent().getRouter().navTo("franceInvoiceDetail", {
                invoiceId: sInvoiceId
            });
        },

        onDownloadInvoice: function (oEvent) {
            MessageToast.show("Functionality simulated for demo.");
        }
    });
});
