window.onload = function () {
    var date_display,
        range_display;

    date_display = function (evt, ui) {
        d3.select("#date-label")
            .text(tangelo.date.displayDate(new Date(ui.value)));
    };

    range_display = function (evt, ui) {
        d3.select("#range-label")
            .text(ui.value + " day" + (ui.value !== 1 ? "s" : ""));
    };

    $("#date").slider({
        min: new Date("October 27, 2012").getTime(),
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
}
