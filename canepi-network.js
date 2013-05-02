var nodes,
    links,
    force,
    width,
    height,
    color;

function updateGraph() {
    "use strict";

    var update,
        change_button,
        start_date,
        end_date,
        data,
        map;

    update = d3.select("#update");
    change_button = !update.attr("disabled");

    if (change_button) {
        update.attr("disabled", true)
            .text("Updating...");
    }

    start_date = new Date($("#date").slider("value"));
    end_date = new Date(start_date.getTime() + $("#range").slider("value") * 86400 * 1000);

    data = {
        start_date: start_date.getFullYear() + "-" + (start_date.getMonth() + 1) + "-" + start_date.getDate(),
        end_date: end_date.getFullYear() + "-" + (end_date.getMonth() + 1) + "-" + end_date.getDate()
    };

    $.ajax({
        url: "service/canepi-network",
        data: data,
        dataType: "json",
        success: function (resp) {
            var tau,
                transition_time,
                graph,
                link,
                node,
                enter,
                newidx,
                angle;

            if (change_button) {
                d3.select("#update")
                    .attr("disabled", null)
                    .text("Update");
            }

            if (resp.error !== null) {
                console.log("error: " + resp.error);
                return;
            }

            map = {};
            $.each(force.nodes(), function (i, v) {
                map[v.id] = v;
            });

            graph = resp.result;
            console.log(graph);
            newidx = [];
            $.each(graph.nodes, function (i, v) {
                if (map.hasOwnProperty(v.id)) {
                    graph.nodes[i].x = map[v.id].x;
                    graph.nodes[i].y = map[v.id].y;
                } else {
                    newidx.push(i);
                }
            });

            tau = 2 * Math.PI;
            angle = tau / newidx.length;
            $.each(newidx, function (i, v) {
                graph.nodes[i].x = (width/4) * Math.cos(i * angle) + (width/2);
                graph.nodes[i].y = (height/4) * Math.sin(i * angle) + (height/2);
            });

            transition_time = 1000;

            link = d3.select("g#links")
                .selectAll(".link")
                .data(graph.links, function (d) {
                    return graph.nodes[d.source].id + graph.nodes[d.target].id;
                });

            console.log(link);

            link.enter().append("line")
                .classed("link", true)
                .style("opacity", 0.0)
                .style("stroke-width", 0.0)
                .transition()
                .duration(transition_time)
                .style("opacity", 1.0)
                .style("stroke-width", 1.0);

            link.exit()
                .transition()
                .duration(transition_time)
                .style("opacity", 0.0)
                .style("stroke-width", 0.0)
                .remove();

            node = d3.select("g#nodes")
                .selectAll(".node")
                .data(graph.nodes, function (d) {
                    console.log(d.id);
                    return d.id;
                });

            enter = node.enter().append("circle")
                .classed("node", true)
                .attr("r", 10)
                .style("opacity", 0.0)
                .style("fill", "red");
            enter.transition()
                .duration(transition_time)
                .attr("r", 5)
                .style("opacity", 1.0)
                .style("fill", function (d) {
                    return color(d.type);
                });

            enter.call(force.drag)
                .append("title")
                .text(function (d) {
                    if (d.type === "alert") {
                        return tangelo.date.displayDate(new Date(d.date.$date));
                    } else {
                        return d.id;
                    }
                });

            node.exit()
                .transition()
                .duration(transition_time)
                .style("opacity", 0.0)
                .attr("r", 0.0)
                .style("fill", "black")
                .remove();

            force.nodes(graph.nodes)
                .links(graph.links)
                .start();

            force.on("tick", function () {
                link.attr("x1", function (d) { return d.source.x; })
                    .attr("y1", function (d) { return d.source.y; })
                    .attr("x2", function (d) { return d.target.x; })
                    .attr("y2", function (d) { return d.target.y; });

                node.attr("cx", function (d) { return d.x; })
                    .attr("cy", function (d) { return d.y; })
            });
        }
    });
}

window.onload = function () {
    "use strict";

    var date_display,
        range_display;

    width = $(window).width();
    height = $(window).height();
    force = d3.layout.force()
        .charge(-500)
        .linkDistance(100)
        .gravity(0.2)
        .friction(0.6)
        .size([width, height]);
    color = d3.scale.category20();

    date_display = function (evt, ui) {
        d3.select("#date-label")
            .text(tangelo.date.displayDate(new Date(ui.value)));
    };

    range_display = function (evt, ui) {
        d3.select("#range-label")
            .text(ui.value + " day" + (ui.value !== 1 ? "s" : ""));
    };

    $("#date").slider({
        min: new Date("October 28, 2012").getTime(),
        max: new Date("April 25, 2013").getTime(),
        step: 86400e3,
        slide: date_display,
        change: date_display
    });
    $("#date").slider("value", $("#date").slider("value"));

    $("#range").slider({
        min: 1,
        max: 42,
        step: 1,
        slide: range_display,
        change: range_display
    });
    $("#range").slider("value", $("#range").slider("value"));

    d3.select("#update")
        .on("click", updateGraph);

    d3.select("#animate")
        .on("click", function () {
            console.log("animate button clicked");
        });

    updateGraph();
}
