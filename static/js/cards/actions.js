class Action extends Card {
    constructor(feat_name, data, data_key, selected_characters, div_id, height, description) {
        super(feat_name, data, selected_characters, div_id, height, description)
        var self = this;
        self.isClicked = false
        self.svg.yAxis = false
        self.data_key = data_key
        self.selected_data = self.data_prep(self.data[self.data_key], feat_name, false, -1, this.selected_characters)
        self.chart = self.visualize_actions()
        $("#" + self.svg.svg_id).append(self.chart)
        self.chart.update(self.selected_data, self.x_domain)
    }
    data_prep(data, feat_name, selected_part = false, selected_chapter = -1, selected_characters = []) {
        var self = this
        var selected_data = self.filter_by_characters(data, selected_characters)
            .filter(d => d[self.feat_name] != 0)

        selected_data.sort((a, b) => d3.ascending(self.y_domain.indexOf(a.character), self.y_domain.indexOf(b.character)))

        return selected_data
    }

    visualize_actions() {
        var self = this;

        self.svg.g = d3.create("svg")
            .attr("width", self.svg.width)
            .attr("height", self.svg.height)
            .attr("viewBox", [0, 0, self.svg.width, self.svg.height]);

        self.svg.zx = self.svg.x.copy()
        self.svg.zy = self.svg.y.copy()

        self.svg.bars = self.svg.g
            .selectAll(".action_bar")

        return Object.assign(self.svg.g.node(), {
            update(data, domain) {
                const t = self.svg.g.transition().duration(750);
                console.log("animate!")
                self.svg.zx.domain(domain);

                var chars = d3.map(data, d => d.character)
                self.svg.zy.domain(chars)

                // presence min, max. do not need it for sentiments
                var y_domain = [0, 1]
                self.stroke = 0.1
                self.padding = 3

                // Build color scale
                self.svg.color = d3.scaleSequential()
                    .interpolator(d3.interpolateBlues)
                    .domain(y_domain);

                // append color legend
                var colo_map = { 0: 'Low', 0.5: 'Medium', 1: 'High' }
                self.svg.color_legend = Legend(self.svg.color, {
                    width: 250,
                    tickSize: 3,
                    height: 15,
                    marginLeft: 10,
                    marginTop: 2,
                    marginBottom: 5,
                    tickValues: [0, 0.5, 1],
                    tickFormat: d => colo_map[d]
                })
                $("#" + self.svg.svg_id).children('.legend').remove()
                $("#" + self.svg.svg_id).append(self.svg.color_legend)

                $("#" + self.svg.svg_id).children('.time_axis').remove()
                if (VIZ.isClicked)
                    $("#" + self.svg.svg_id).append('<span class="time_axis" style="margin-left:' + self.svg.width / 4 + 'px;font-size:1.3rem">Sentences &#8594</span>')
                else
                    $("#" + self.svg.svg_id).append('<span class="time_axis" style="margin-left:' + self.svg.width / 4 + 'px;font-size:1.3rem">Chapters &#8594</span>')

                var unique_chars = [... new Set(chars)]
                if (self.svg.yAxis)
                    self.svg.yAxis.selectAll("*").remove()
                // Show the shorthands only if there's less than 10 characters
                if ((self.svg.height / unique_chars.length) >= 9) {
                    // create y axis
                    self.svg.yAxis = g => g
                        .attr("transform", `translate(${self.svg.margin.left},0)`)
                        .call(d3.axisLeft(self.svg.zy).tickFormat(c => self.shorthands[c]))
                        .call(g => g.selectAll(".domain").remove())
                        .call(g => g.selectAll("line").remove())
                        .call(g => g.selectAll("text").attr("class", "y_axis_label"));

                    self.svg.yAxis = self.svg.g.append("g")
                        .style("font-size", "12px")
                        .style("font-family", "Gill Sans, sans-serif")
                        .style("cursor", "pointer")
                        .style("color", "black")
                        .call(self.svg.yAxis)
                }
                // plot actions line

                self.svg.bars = self.svg.bars
                    .data(data)
                    .join(
                        enter => enter.append("rect")
                            .attr("class", self.feat_name + "_bar features_unit")
                            .attr("fill", d => self.svg.color(d[self.feat_name]))
                            .attr("stroke", "black")
                            .attr("stroke-width", self.stroke)
                            .attr("character", d => d.character)
                            .attr("x", d => self.svg.zx(d.start_char))
                            .attr("y", 0)
                            .attr("width", d => self.svg.zx(d.end_char) -
                                self.svg.zx(d.start_char) - self.padding)
                            .attr("height", self.svg.zy.bandwidth()),
                        update => update
                            .attr("fill", d => self.svg.color(d[self.feat_name]))
                            .attr("y", 0)
                            .attr("x", d => self.svg.zx(d.start_char))
                            .attr("stroke", "black")
                            .attr("stroke-width", self.stroke)
                            .attr("height", self.svg.zy.bandwidth())
                            .attr("width", d => self.svg.zx(d.end_char) -
                                self.svg.zx(d.start_char) - self.padding),
                        exit => exit
                            .call(d => d.transition(t).attr("y", 30).remove())
                    )
                    .call(d => d.transition(t)
                        .attr("y", d => self.svg.zy(d.character)))
            }
        });

    }
    append_to_list(list_id, text) {
        var html_string = '<div class="item">' +
            '<div class="content" >' +
            '<div class="description">' + text + '</div>' +
            '</div >' +
            '</div >';

        $("#" + list_id).append(html_string)
    }

    list_frames(part, chapter, character) {

        var self = this;
        $("#frames").show()
        $("#frame_list1").empty()
        $("#frame_list2").empty()

        var selected_words = []
        // console.log(part, chapter, character)
        if (chapter > 0) {
            var act = self.data.actions.filter(a => (a.part == part) &&
                (a.chapter == (chapter)) && (a.character == character))

            // console.log(act)
            var selected_frames = act[0]['prev_frames'].sort(
                (a, b) => d3.ascending(a.sorted_idx, b.sorted_idx)
            )
            // console.log(selected_frames)
            var text = "<span style='font-weight:bold'>Chapter " + chapter + "</span>"
            self.append_to_list("frame_list1", text)
            selected_frames.forEach(function (f, i) {
                // if ("embedding" in f){
                var text = ""
                f['args'].forEach(function (arg) {
                    if (arg.arg_type.indexOf("V") != -1)
                        text += "<span style='font-weight:bold'>" + arg.arg_text + " </span>"
                    else
                        text += "<span>" + arg.arg_text + " </span>"
                })
                self.append_to_list("frame_list1", text)
            })

            selected_frames = act[0]['curr_frames'].sort(
                (a, b) => d3.ascending(a.sorted_idx, b.sorted_idx)
            )
            // console.log(selected_frames)
            var text = "<span style='font-weight:bold; color:" + CONFIG['highlight_color2'] + "'>Chapter " + (chapter + 1) + "</span>"
            self.append_to_list("frame_list2", text)
            selected_frames.forEach(function (f, i) {

                var text = ""
                f['args'].forEach(function (arg) {
                    if (arg.arg_type.indexOf("V") != -1)
                        text += "<span style='color:" + CONFIG['highlight_color2'] + "'>" + arg.arg_text + " </span>"
                    else
                        text += "<span>" + arg.arg_text + " </span>"
                })

                self.append_to_list("frame_list2", text)
            })
        }
    }
}