sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "invoice/app/model/formatter"
], function (Controller, JSONModel, MessageToast, DateFormat, formatter) {
    "use strict";

    return Controller.extend("invoice.app.controller.france.FranceDashboard", {

        formatter: formatter,

        onInit: function () {
            // Force Spanish locale for correct number formatting
            sap.ui.getCore().getConfiguration().setLanguage("es-ES");
            sap.ui.getCore().getConfiguration().setFormatLocale("es-ES");

            var oViewModel = new JSONModel({
                kpi: {
                    totalRevenue: 0,
                    totalCount: 0,
                    outstandingAmount: 0,
                    averageTicket: 0
                },
                charts: {
                    revenue: [],
                    status: []
                },
                recentInvoices: []
            });
            this.getView().setModel(oViewModel, "dashboard");

            // Load Data
            this._loadRealData();
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

            // 1. KPIs
            var fTotalRevenue = 0;
            var fOutstanding = 0;
            var iCount = aInvoices.length;

            if (!Array.isArray(aInvoices)) {
                console.error("Data is not an array:", aInvoices);
                return;
            }

            aInvoices.forEach(inv => {
                var fAmount = this._parseNumber(inv.total);
                console.log("Invoice:", inv.numero, "Raw Total:", inv.total, "Parsed:", fAmount);
                fTotalRevenue += fAmount;
                if (inv.estado === 'PENDIENTE') {
                    fOutstanding += fAmount;
                }
            });
            console.log("Total Revenue Calculated:", fTotalRevenue);

            var fAvgTicket = iCount > 0 ? fTotalRevenue / iCount : 0;

            oModel.setProperty("/kpi", {
                totalRevenue: fTotalRevenue,
                totalCount: iCount,
                outstandingAmount: fOutstanding,
                averageTicket: fAvgTicket
            });

            // 2. Charts - Revenue by Month (Last 6 Months)
            var oRevenueByMonth = {};
            var oDateFormat = DateFormat.getDateInstance({ pattern: "MMM yyyy" });
            var fMaxRevenue = 0;

            // Initialize last 6 months
            for (var i = 5; i >= 0; i--) {
                var d = new Date();
                d.setMonth(d.getMonth() - i);
                var sKey = oDateFormat.format(d);
                oRevenueByMonth[sKey] = 0;
            }

            aInvoices.forEach(inv => {
                if (inv.fecha_emision) {
                    var dDate = new Date(inv.fecha_emision);
                    var sKey = oDateFormat.format(dDate);
                    if (oRevenueByMonth.hasOwnProperty(sKey)) {
                        var val = this._parseNumber(inv.total);
                        oRevenueByMonth[sKey] += val;
                    }
                }
            });

            // Find max for percentage
            Object.values(oRevenueByMonth).forEach(val => {
                if (val > fMaxRevenue) fMaxRevenue = val;
            });

            var aRevenueChart = Object.keys(oRevenueByMonth).map(key => ({
                month: key,
                revenue: oRevenueByMonth[key].toFixed(2),
                percent: fMaxRevenue > 0 ? (oRevenueByMonth[key] / fMaxRevenue) * 100 : 0
            }));
            oModel.setProperty("/charts/revenue", aRevenueChart);

            // 3. Charts - Status Distribution
            var oStatusCount = {};
            aInvoices.forEach(inv => {
                var sStatus = inv.estado || "UNKNOWN";
                oStatusCount[sStatus] = (oStatusCount[sStatus] || 0) + 1;
            });

            var aStatusChart = Object.keys(oStatusCount).map(key => ({
                status: key,
                count: oStatusCount[key],
                percent: iCount > 0 ? ((oStatusCount[key] / iCount) * 100).toFixed(1) : 0
            }));
            oModel.setProperty("/charts/status", aStatusChart);

            // 4. Recent Invoices (Last 5)
            // Sort by date desc
            var aSorted = aInvoices.sort((a, b) => {
                return new Date(b.fecha_emision) - new Date(a.fecha_emision);
            });
            var aRecent = aSorted.slice(0, 5).map(inv => {
                // Ensure date object for formatting
                inv.fecha_emision = new Date(inv.fecha_emision);
                return inv;
            });
            oModel.setProperty("/recentInvoices", aRecent);
        },

        _parseNumber: function (vValue) {
            if (!vValue) return 0;
            if (typeof vValue === 'number') return vValue;

            // If it's a string
            var sValue = vValue.toString();

            // Check if it looks like Spanish format (has dots as thousands separator or comma as decimal)
            // Example: "5.000" -> 5000, "5.000,00" -> 5000.00, "5,50" -> 5.50
            if (sValue.includes('.') && sValue.includes(',')) {
                // "5.000,00" -> remove dots, replace comma with dot
                sValue = sValue.replace(/\./g, '').replace(',', '.');
            } else if (sValue.includes(',') && !sValue.includes('.')) {
                // "5,50" -> replace comma with dot
                sValue = sValue.replace(',', '.');
            } else if (sValue.includes('.') && sValue.indexOf('.') === sValue.lastIndexOf('.') && sValue.length - sValue.indexOf('.') === 4) {
                // "5.000" -> remove dot (thousands separator)
                // Heuristic: if only one dot and 3 digits after it, assume thousands separator
                sValue = sValue.replace(/\./g, '');
            }

            return parseFloat(sValue) || 0;
        },

        onNavToInvoiceDetail: function (oEvent) {
            var oItem = oEvent.getSource();
            var oContext = oItem.getBindingContext("dashboard");
            var sInvoiceId = oContext.getProperty("id_factura");

            this.getOwnerComponent().getRouter().navTo("franceInvoiceDetail", {
                invoiceId: sInvoiceId
            });
        }
    });
});
