/*jslint browser: true */

/*globals $, tangelo, d3, vg, console */

$(function () {
    "use strict";

    // Make the body element the correct size for no scrolling
    d3.select("body").style("height", $(window).height() - 60);

    function init(data) {
        var view;

        // Generate the visualization
        vg.parse.spec("scatter.json", function (chart) {
            var padding = {}, width = 2000, height = 1000;
            padding.top = ($(window).height() - 60 - height) / 2;
            padding.left = ($(window).width() - width) / 2;
            padding.bottom = padding.top;
            padding.right = padding.left;

            view = chart({el: "#vis", data: data}).width(width).height(height).padding(padding).update();
        });
    }

    // Load in the county, state, and initial contribution data
    d3.json("service/canepi", function (error, alerts) {
        var data = {alerts: alerts};
        init(data);
    });
});
