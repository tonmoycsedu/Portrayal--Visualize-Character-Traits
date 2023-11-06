class Emotion extends Card {
    constructor(feat_name, data, data_key, selected_characters, div_id, height, description) {
        super(feat_name, data, selected_characters, div_id, height, description)
        var self = this;
        self.svg.yAxis = false
        self.isClicked = false
        self.data_key = data_key
        self.selected_data = self.data_prep(self.data[self.data_key], feat_name, false, -1, this.selected_characters)
        self.chart = self.visualize_emotion()
        $("#" + self.svg.svg_id).append(self.chart)
        self.chart.update(self.selected_data, self.x_domain)
    }
    data_prep(data, feat_name, selected_part = false, selected_chapter = -1, selected_characters = []) {
        var self = this
        var selected_data = []
        if (selected_chapter < 0) {
            selected_data = d3.flatRollup(data, v => d3.group(v, d => d[feat_name]),
                d => d.part, d => d.chapter, d => d.character)

            selected_data = selected_data.map(d => ({
                part: d[0], chapter: d[1], character: d[2],
                [feat_name]: d3.map(d[3], d => ({ type: d[0], value: d[1].length }))
                    .sort((a, b) => d3.descending(a.value, b.value)),
                start_char: self.data.chapters_map[d[0]].chapters[d[1]].start_char,
                end_char: self.data.chapters_map[d[0]].chapters[d[1]].end_char
            }
            ))
        }
        else {
            selected_data = data.filter(d => (d.part == selected_part) && (d.chapter == selected_chapter))
            selected_data = selected_data.map(d => ({
                part: d.part, chapter: d.chapter, character: d.character,
                [feat_name]: [{'type': d.emotion, 'value': 1}],
                start_char: d.start_char,
                end_char: d.end_char,
                global_sent_id: d.global_sent_id
            }
            ))
        }
        selected_data = self.filter_by_characters(selected_data, selected_characters)
        selected_data.sort((a, b) => d3.ascending(self.y_domain.indexOf(a.character), self.y_domain.indexOf(b.character)))
        return selected_data
    }
    visualize_emotion() {
        var self = this;

        self.svg.g = d3.create("svg")
            .attr("width", self.svg.width)
            .attr("height", self.svg.height)
            .attr("viewBox", [0, 0, self.svg.width, self.svg.height]);

        self.svg.zx = self.svg.x.copy()
        self.svg.zy = self.svg.y.copy()

        self.svg.bars = self.svg.g
            .selectAll(".emotion_bar")

        return Object.assign(self.svg.g.node(), {
            update(data, domain) {
                const t = self.svg.g.transition().duration(750);
                console.log("animate!")
                self.svg.zx.domain(domain);

                var chars = d3.map(data, d => d.character)
                self.svg.zy.domain(chars)

                if (VIZ.isClicked) {
                    self.stroke = 0
                    self.padding = 0
                }
                else {
                    self.stroke = 0.1
                    self.padding = 3
                }
                // Build color scale
                // if(name == "the_yellow_wallpaper")
                    self.svg.color = d3.scaleOrdinal(d3.schemeAccent)
                        .domain(["joy", "anger", "sadness", "optimism"]);
                // else
                //     self.svg.color = d3.scaleOrdinal(d3.schemeAccent)
                //         .domain(['joy', 'anger', 'sadness', 'love', 'fear']);

                // append color legend
                self.svg.color_legend = Legend(self.svg.color, {
                    width: 250,
                    tickSize: 3,
                    height: 15,
                    marginLeft: 10,
                    marginTop: 2,
                    marginBottom: 5
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
                if ((self.svg.height / unique_chars.length) >= 8) {
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

                // plot colored presence bars
                self.svg.bars = self.svg.bars
                    .data(data)
                    .join(
                        enter => enter.append("rect")
                            .attr("class", "emotion_bar features_unit")
                            .attr("fill", d => self.svg.color(d[self.feat_name][0].type))
                            .attr("stroke", "black")
                            .attr("stroke-width", self.stroke)
                            .attr("character", d => d.character)
                            .attr("x", d => self.svg.zx(d.start_char))
                            .attr("y", 0)
                            .attr("width", d => self.svg.zx(d.end_char) -
                                self.svg.zx(d.start_char) - self.padding)
                            .attr("height", self.svg.zy.bandwidth()),
                        update => update
                            .attr("fill", d => self.svg.color(d[self.feat_name][0].type))
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

                // VIZ.install_events()
            }
        });

    }
    install_events() {
        var self = this;
    }
}