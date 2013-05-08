/*jslint browser: true */

/*globals $, tangelo, d3, vg, console */

$(function () {
    "use strict";

    var full_data,
        view,
        data,
        country_filter = "",
        disease_filter = "";

    // Make the body element the correct size for no scrolling
    d3.select("body").style("height", $(window).height() - 60);

    function update() {
        var min_date, max_date, i, d;

        min_date = new Date($("#date").slider("values", 0));
        max_date = new Date($("#date").slider("values", 1));

        data = [];
        for (i = 0; i < full_data.length; i += 1) {
            d = full_data[i];
            if (d[0] >= min_date && d[0] <= max_date
                    && d[2] && d[2].toLowerCase().indexOf(disease_filter) !== -1
                    && d[3] && d[3].toLowerCase().indexOf(country_filter) !== -1) {
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
            view.on("mouseover", function (event, item) {
                d3.text("service/canepi?details=" + item.datum.index, function (error, data) {
                    var d = item.datum.data,
                        date = new Date(d[0]);
                    $(".hoverbox").empty();
                    $(".hoverbox").append($("<div>" + d[2] + "</div>"));
                    $(".hoverbox").append($("<div>" + d[3] + "</div>"));
                    $(".hoverbox").append($("<div>" + date.toISOString() + "</div>"));
                    $(".hoverbox").append($("<div>Rating: " + d[1] + "</div>"));
                    $(".hoverbox").append($("<div>Summary: " + data + "</div>"));
                    d3.select(".hoverbox").transition().duration(200).style("opacity", 1);
                });
            });
            view.on("mouseout", function (event, item) {
                d3.select(".hoverbox").transition().duration(200).style("opacity", 0);
            });
            $("#date").slider("values", 0, new Date("October 28, 2012").getTime());
            $("#date").slider("values", 1, new Date("April 25, 2013").getTime());
        });
    }

    function date_display(evt, ui) {
        d3.select("#date-min-label")
            .text(tangelo.date.displayDate(new Date(ui.values[0])));
        d3.select("#date-max-label")
            .text(tangelo.date.displayDate(new Date(ui.values[1])));
    }

    $("#date").slider({
        range: true,
        min: new Date("October 28, 2012").getTime(),
        max: new Date("April 25, 2013").getTime(),
        step: 86400e3,
        slide: date_display,
        change: function (evt, ui) { date_display(evt, ui); update(); }
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
        var i, color = d3.scale.category20();
        full_data = alerts;
        for (i = 0; i < full_data.length; i += 1) {
            full_data[i].push(color(full_data[i][3]));
        }
        init();
    });
});
