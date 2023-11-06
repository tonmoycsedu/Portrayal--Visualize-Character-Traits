class Presence extends Card{
    constructor(feat_name, data, data_key, selected_characters, div_id, height, description){
        super(feat_name, data, selected_characters, div_id, height, description)
        var self = this;
        self.isClicked = false
        self.svg.yAxis = false
        self.data_key = data_key
        self.selected_data = self.data_prep(self.data[self.data_key], self.feat_name, false, -1, this.selected_characters)
        self.chart = self.visualize_presence()
        $("#" + self.svg.svg_id).append(self.chart)
        self.chart.update(self.selected_data, self.x_domain)
        $("#" + self.feat_name + "_meta").append('<input id= "normalize_presence" type = "checkbox" > Normalize by chapter length')
        self.normalize = false 
        self.install_local_events()  
    }
    data_prep(data, feat_name, selected_part = false, selected_chapter = -1, selected_characters = []) {
        var self = this
        var selected_data = []
        if (selected_chapter < 0) {
            selected_data = d3.flatRollup(data, v => v.length,
                d => d.part, d => d.chapter, d => d.character).map(d => (
                    {
                        part: d[0], chapter: d[1], character: d[2], [feat_name]: d[3],
                        start_char: self.data.chapters_map[d[0]].chapters[d[1]].start_char,
                        end_char: self.data.chapters_map[d[0]].chapters[d[1]].end_char
                    }
                ))
            if(self.normalize){
                selected_data.forEach(d => d[feat_name] = d[feat_name]/(d.end_char - d.start_char))
            }
        }
        else {
            selected_data = data.filter(d => (d.part == selected_part) && (d.chapter == selected_chapter))
        }
        selected_data = self.filter_by_characters(selected_data, selected_characters)
        selected_data.sort( (a, b) => d3.ascending(self.y_domain.indexOf(a.character), self.y_domain.indexOf(b.character)))
        return selected_data
    }
    visualize_presence() {
        var self = this;

        self.svg.g = d3.create("svg")
            .attr("width", self.svg.width)
            .attr("height", self.svg.height)
            .attr("viewBox", [0, 0, self.svg.width, self.svg.height]);

        // self.create_annotation()

        self.svg.zx = self.svg.x.copy()
        self.svg.zy = self.svg.y.copy()

        self.svg.bars = self.svg.g
            .selectAll(".presence_bar")

        return Object.assign(self.svg.g.node(), {
            update(data, domain) {
                const t = self.svg.g.transition().duration(750);
                console.log("animate!")
                self.svg.zx.domain(domain);

                var chars = d3.map(data, d => d.character)
                self.svg.zy.domain(chars)

                // presence min, max. do not need it for sentiments
                var mx = d3.max(data, d => d[self.feat_name])
                var mn = d3.min(data, d => d[self.feat_name])
                var mid = (mn+mx)/2
                var y_domain = [mn, mx]

                if (VIZ.isClicked) {
                    self.stroke = 0
                    self.padding = 0
                }
                else {
                    self.stroke = 0.1
                    self.padding = 3
                }
                // console.log(self.stroke, self.padding)

                // Build color scale
                self.svg.color = d3.scaleSequential()
                    .interpolator(d3.interpolateBlues)
                    .domain(y_domain);

                if(VIZ.isClicked)
                    var colo_map = { [mn]: mn, [mid]: mid, [mx]: mx };
                else
                    var colo_map = { [mn]: 'Low', [mid]: 'Medium', [mx]: 'High' };

                self.svg.color_legend = Legend(self.svg.color, {
                    title: "number of mentions",
                    width: 250,
                    tickSize: 3,
                    height: 15,
                    marginLeft: 10,
                    marginTop: 2,
                    marginBottom: 5,
                    tickValues: [mn, mid, mx],
                    tickFormat: d => colo_map[d]
                })
                $("#" + self.svg.svg_id).children('.legend').remove()
                $("#" + self.svg.svg_id).append(self.svg.color_legend)

                $("#" + self.svg.svg_id).children('.time_axis').remove()
                if(VIZ.isClicked)
                    $("#" + self.svg.svg_id).append('<span class="time_axis" style="margin-left:' + self.svg.width / 4 + 'px;font-size:1.3rem">Sentences &#8594</span>')
                else
                    $("#" + self.svg.svg_id).append('<span class="time_axis" style="margin-left:'+self.svg.width/4+'px;font-size:1.3rem">Chapters &#8594</span>')

                var unique_chars = [... new Set(chars)]
                if (self.svg.yAxis)
                    self.svg.yAxis.selectAll("*").remove()
                // Show the shorthands only if there's less than 10 characters
                if ( (self.svg.height / unique_chars.length) >=  8) {
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
                            .attr("class", "presence_bar features_unit")
                            .attr("fill", d => self.svg.color(d.presence))
                            .attr("stroke", "black")
                            .attr("stroke-width", self.stroke)
                            .attr("character", d => d.character)
                            .attr("x", d => self.svg.zx(d.start_char))
                            .attr("y", 0)
                            .attr("width", d => self.svg.zx(d.end_char) -
                                self.svg.zx(d.start_char) - self.padding)
                            .attr("height", self.svg.zy.bandwidth()),
                        update => update
                            .attr("fill", d => self.svg.color(d.presence))
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
    install_local_events() {
        var self = this;
        $("#normalize_presence").on("change", function(){
            if ($(this).prop('checked'))
                self.normalize = true
            else self.normalize = false

            if (!VIZ.isClicked) {
                self.selected_data = self.data_prep(self.data[self.data_key], self.feat_name, false, -1, self.selected_characters)
                self.chart.update(self.selected_data, self.x_domain)
            }
        })
    }
}