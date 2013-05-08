/*jslint browser: true */

/*globals $, tangelo, d3, vg, console */

$(function () {
    "use strict";

    var full_data;
    var view;
    var data;
    var country_filter = "";
    var disease_filter = "";

    // Make the body element the correct size for no scrolling
    d3.select("body").style("height", $(window).height() - 60);

    function update() {
        var min_date, max_date, i, d;

        min_date = new Date($("#date-min").slider("value"));
        max_date = new Date($("#date-max").slider("value"));

        data = [];
        for (i = 0; i < full_data.length; ++i) {
            d = full_data[i];
            if (d[0] >= min_date && d[0] <= max_date
                && d[2] && d[2].toLowerCase().indexOf(disease_filter) != -1
                && d[3] && d[3].toLowerCase().indexOf(country_filter) != -1) {
                data.push(d);
            }
        }

        // Update the visualization
        view.data({alerts: data}).update({duration: 0});
    }

    function init() {
        // Generate the visualization
        vg.parse.spec("scatter.json", function (chart) {
            var padding = {}, width = 1000, height = 500;
            padding.top = ($(window).height() - 60 - height) / 2;
            padding.left = ($(window).width() - width) / 2;
            padding.bottom = padding.top;
            padding.right = padding.left;

            view = chart({el: "#vis", data: {alerts: full_data}}).width(width).height(height).padding(padding).update();
            $("#date-min").slider("value", new Date("October 28, 2012").getTime());
            $("#date-max").slider("value", new Date("April 25, 2013").getTime());
        });
    }

    function date_min_display(evt, ui) {
        d3.select("#date-min-label")
            .text(tangelo.date.displayDate(new Date(ui.value)));
    }

    function date_max_display(evt, ui) {
        d3.select("#date-max-label")
            .text(tangelo.date.displayDate(new Date(ui.value)));
    }

    $("#date-min").slider({
        min: new Date("October 28, 2012").getTime(),
        max: new Date("April 25, 2013").getTime(),
        step: 86400e3,
        slide: date_min_display,
        change: function(evt, ui) { date_min_display(evt, ui); update(); }
    });

    $("#date-max").slider({
        min: new Date("October 28, 2012").getTime(),
        max: new Date("April 25, 2013").getTime(),
        step: 86400e3,
        slide: date_max_display,
        change: function(evt, ui) { date_max_display(evt, ui); update(); }
    });

    d3.select("#country").on("keyup", function () {
        country_filter = this.value;
        update();
    });

    d3.select("#disease").on("keyup", function () {
        disease_filter = this.value;
        update();
    });

    // Load in the county, state, and initial contribution data
    d3.json("service/canepi", function (error, alerts) {
        full_data = alerts;
        for (var i = 0; i < full_data.length; ++i) {
            full_data[i].push(i);
        }
        init();
    });
});
