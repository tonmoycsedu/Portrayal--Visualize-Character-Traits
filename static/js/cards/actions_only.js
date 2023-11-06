class Actions_only extends Card {
    constructor(feat_name, data, data_key, selected_characters, div_id, height, description) {
        super(feat_name, data, selected_characters, div_id, height, description)
        var self = this;
        self.svg.yAxis = false
        self.data_key = data_key
        self.isClicked = false
        self.count_vector = self.create_word_dictionary(self.data[self.data_key], feat_name)
        self.selected_data = self.data_prep(self.data[self.data_key], feat_name, false, -1, this.selected_characters)
        self.chart = self.visualize_adjectives()
        $("#" + self.svg.svg_id).append(self.chart)
        self.chart.update(self.selected_data, self.x_domain)
        $("#" + self.feat_name + "_meta").append('<span>Try taking your mouse over a character on the left</span>')
        $("#" + self.feat_name + "_meta").append('<button id="prev_word" class="ui mini button compact" style="display:none">Prev Mention</button>')
        $("#" + self.feat_name + "_meta").append('<button id="next_word" class="ui mini button compact" style="display:none">Next Mention</button>')
        $("#" + self.feat_name + "_meta").append('<button id="remove_word" class="ui mini button compact" style="display:none">Remove Highlight</button>')
        self.install_local_events()
    }
    create_word_dictionary(data, feat_name) {
        var grp = d3.flatGroup(data, d => d[feat_name])
        var count_vector = {}
        grp.forEach(w => {
            count_vector[w[0]] = w[1].length
        })

        return count_vector
    }
    select_words(character) {
        var self = this;
        var data = self.selected_data.filter(d => d.character == character)
        var grp = d3.flatGroup(data, d => d[self.feat_name])
        var norm_data = []
        var max_words = 80
        if (("actions_only" in VIZ.cards) && ("adjective" in VIZ.cards))
            max_words = 40

        grp.forEach(a => {
            norm_data.push({
                [self.feat_name]: a[0],
                "count": a[1].length,
                "category": a[1][0]['category'],
                "weight": a[1].length / self.count_vector[a[0]],
                "entries": a[1]
            })
        })
        norm_data.sort((a, b) => d3.descending(a.weight, b.weight) || d3.descending(a.count, b.count))
        // console.log(norm_data)
        if (norm_data.length < max_words) {
            norm_data.push({
                [self.feat_name]: character,
                "count": 1,
                "category": 5,
                "weight": 2,
                "entries": []
            })
            return norm_data
        }
        else {
            norm_data = norm_data.sort(() => 0.5 - Math.random()).slice(0, max_words)
            norm_data.push({
                [self.feat_name]: character,
                "count": 1,
                "category": 5,
                "weight": 2,
                "entries": []
            })
            return norm_data
        }

    }
    highlight_word() {
        var self = this;
        // console.log(self.selected_mentions)
        if (self.selected_mentions.length) {
            var d = self.selected_mentions[self.i]
            ED.quill.formatText(d.action_idx[0], d.action_idx[1] - d.action_idx[0], {
                'bold': true,
                'background': "lightblue"
            });
            ED.quill.formatText(d.sent_start_char, d.sent_end_char - d.sent_start_char, {
                'bold': true
            });
            var bounds = ED.quill.getBounds(d.sent_start_char, d.sent_end_char - d.sent_start_char);
            ED.quill.scrollingContainer.scrollTop = bounds.top;
        }
    }
    remove_highlight() {
        var self = this;
        self.selected_mentions.forEach(function (d) {
            ED.quill.removeFormat(d.sent_start_char, d.sent_end_char - d.sent_start_char)
        })
    }
    data_prep(data, feat_name, selected_part = false, selected_chapter = -1, selected_characters = []) {
        var self = this
        var selected_data = self.filter_by_characters(data, selected_characters)
        selected_data.sort((a, b) => d3.ascending(self.y_domain.indexOf(a.character), self.y_domain.indexOf(b.character)))
        return selected_data
    }

    wordzone(dataSet) {
        var self = this
        console.log(dataSet)
        d3.selectAll(".word_action").remove()
        var BrowserText = (function () {
            var canvas = document.createElement('canvas'),
                context = canvas.getContext('2d');

            /**
             * Measures the rendered width of arbitrary text given the font size and font face
             * @param {string} text The text to measure
             * @param {number} fontSize The font size in pixels
             * @param {string} fontFace The font face ("Arial", "Helvetica", etc.)
             * @returns {number} The width of the text
             **/
            function getWidth(text, fontSize, fontFace) {
                context.font = fontSize + 'px ' + fontFace;
                return context.measureText(text).width;
            }

            return {
                getWidth: getWidth
            };
        })();

        // initialize constants
        const width = self.svg.width,        // svg width
            height = self.svg.height,          // svg height
            clusterPadding = 10,   // separation between different-color nodes
            maxRadius = 10,        // required by force cluster package
            baseFontSize = 12,     // this font size gets randomly varied
            fontOffset = 0.5,
            fontFace = 'Cairo',    // font face
            padding = 8,
            categoryOffset = 1;    // categories in data must be numbered consecutively; 

        if (("actions_only" in VIZ.cards) && ("adjective" in VIZ.cards))
            var circleDiameter = 90
        else
            var circleDiameter = 150  // diameter of entire circle

        const pink = 'rgb(245, 41, 121)', green = 'rgb(35, 183, 13)', deeppurple = 'rgb(51, 41, 151)',
            redbrown = 'rgb(126, 0, 2)', orange = 'rgb(253, 107, 9)', lavendar = 'rgb(90, 87, 170)',
            blue = 'rgb(11, 94, 153)', tomato = 'rgb(243, 0, 21)', purple = 'rgb(114, 41, 114)';

        // array of unique category numbers (usually 1 ... n)
        let uniqueRegions = Array.from(new Set(dataSet.map(d => d.category)))
        let m = uniqueRegions.length; // number of distinct categories

        // map category numbers into colors
        let colorScaleOrdinal = d3.scaleOrdinal()
            .range([green, blue, pink, lavendar, redbrown, orange, purple])
            .domain(uniqueRegions);

        // Find the span of values (min to max) from an array 
        function getRangeFromValues(dataset, fieldname) {
            const values = Array.from(new Set(dataset.map(d => d[fieldname])));
            return [d3.min(values), d3.max(values)];
        }
        // Map opacity scores into a range according to weight field
        let opacityScale = d3.scaleLinear().range([.8, 1.2])
            .domain(getRangeFromValues(dataSet, 'weight'));

        // Store the largest node for each cluster.
        let clusters = new Array(m);

        // create a set of nodes, one for each data item
        let nodes = dataSet.map(function (datum) {
            const fontSize = (datum.weight + 1) * baseFontSize, //baseFontSize + datum.weight, // modify font size by input weight
                textLength = BrowserText.getWidth(datum.adjective, fontSize, fontFace), // get length of text string
                clusterNum = datum.category - categoryOffset,     // index number for cluster
                r = fontSize * fontOffset,  // need r!! used somewhere internally to clustering algorithm
                // create a record for each data item using values defined above
                d = {
                    cluster: clusterNum,
                    name: datum[self.feat_name],
                    weight: datum.weight,
                    radius: r,            // need this!! 
                    // place each datum from each cluster in one location along the diameter of the circle
                    // using m-1 because the first cluster goes in the center
                    x: Math.cos(clusterNum / (m - 1) * 2 * Math.PI) * circleDiameter + width / 2 + Math.random(),
                    y: Math.sin(clusterNum / (m - 1) * 2 * Math.PI) * circleDiameter + height / 2 + Math.random(),
                    fontSize: fontSize,
                    textLength: textLength,
                    entries: datum.entries,
                    card: self.feat_name
                };
            // put words from first category in the center
            if (clusterNum == 0) {
                d.x = width / 2 + Math.random() + self.svg.margin.left;
                d.y = height / 2 + Math.random();
            }
            // choose the longest word to go in the center for each cluster
            if (!clusters[clusterNum] || (textLength > clusters[clusterNum].textLength)) clusters[clusterNum] = d;
            return d;
        });

        // attach text to the nodes laid out above
        let words = self.svg.g.selectAll('.word')
            .data(nodes)
            .enter().append('text')
            .style("text-anchor", "middle")
            .attr("class", "word word_action")
            .style("cursor", "pointer")
            .attr("font-family", fontFace)
            .attr("font-size", d => d.fontSize)
            .attr('opacity', function (d) { return opacityScale(d.weight) })
            .style('fill', function (d) { return colorScaleOrdinal(d.cluster / 10); })

        // Tick function required by force-directed cluster simulation
        function layoutTick(e) {
            words
                .attr('x', function (d) { return d.x; })
                .attr('y', function (d) { return d.y; })
                .text(d => d.name)
        }

        //   /* Need bounding boxes for text, which behaves differently than the circles that are usually plotted.
        //   Therefore, we use rectangleCollide, 
        //   from https://github.com/emeeks/d3-bboxCollide: 
        //   replacing var rectangleCollide = bboxCollide.bboxCollide([[-10,-5],[10,5]]) */

        const rectangleCollide = d3.bboxCollide(function (d) {
            return [[-d.textLength / 2, -d.fontSize / 2], [d.textLength / 2, d.fontSize / 2]];
        });

        function callSimulation() {
            return d3.forceSimulation(nodes)
                // keep entire simulation balanced around screen center
                .force('center', d3.forceCenter(width / 2, height / 2))

                .force('cluster', d3.forceCluster()
                    .centers(function (d) { return clusters[d.cluster]; })
                    .strength(0.7))
                .force('collide', rectangleCollide)
                .on('tick', layoutTick);
        }

        let simulation = callSimulation();

    }

    visualize_adjectives() {
        var self = this;

        self.svg.g = d3.create("svg")
            .attr("width", self.svg.width)
            .attr("height", self.svg.height)
            .attr("viewBox", [0, 0, self.svg.width, self.svg.height])
            .attr("class", "adjective_svg");

        self.svg.zx = self.svg.x.copy()
        self.svg.zy = self.svg.y.copy()

        self.svg.words = self.svg.g
            .selectAll(".word")

        return Object.assign(self.svg.g.node(), {
            update(data, domain) {
                const t = self.svg.g.transition().duration(750);
                var chars = d3.map(data, d => d.character)
                var unique_chars = [... new Set(chars)]
                if (self.svg.yAxis)
                    self.svg.yAxis.selectAll("*").remove()

                if ((self.svg.height / unique_chars.length) < 8) {
                    unique_chars = unique_chars.splice(0, 10)
                }

                self.svg.zy.domain(unique_chars)

                self.svg.yAxis = g => g
                    .attr("transform", `translate(${self.svg.margin.left},0)`)
                    .call(d3.axisLeft(self.svg.zy).tickFormat(c => self.shorthands[c]))
                    .call(g => g.selectAll(".domain").remove())
                    .call(g => g.selectAll("line").remove())
                    .call(g => g.selectAll("text")
                        .attr("class", "word_character_label")
                        .attr("card", self.feat_name));

                self.svg.yAxis = self.svg.g.append("g")
                    .style("font-size", "12px")
                    .style("font-family", "Gill Sans, sans-serif")
                    .style("cursor", "pointer")
                    .style("color", "black")
                    .call(self.svg.yAxis)
            }
        });

    }
    install_local_events() {
        var self = this;
        $("#remove_word").on("click", function () {
            self.isClicked = false
            $("#prev_word").hide()
            $("#next_word").hide()
            $("#remove_word").hide()
            self.remove_highlight()
            self.selected_mentions = []
        })
        $("#next_word").on("click", function () {
            self.i += 1
            if (self.i >= self.selected_mentions.length)
                self.i = self.selected_mentions.length - 1

            self.highlight_word()
        })
        $("#prev_word").on("click", function () {
            self.i -= 1
            if (self.i < 0)
                self.i = 0

            self.highlight_word()
        })
    }
}