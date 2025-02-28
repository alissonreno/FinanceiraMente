// Charts using D3.js
let categoryChart;
let statusChart;

function createCategoryChart(categories) {
    const width = 250;
    const height = 250;
    const radius = Math.min(width, height) / 2;
    
    // Clear previous chart
    d3.select("#categoria-donut").html("");
    
    const svg = d3.select("#categoria-donut")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);
    
    const color = d3.scaleOrdinal()
        .domain(categories.map(d => d.name))
        .range([
            "#4361ee", "#3a0ca3", "#4895ef", "#4cc9f0", 
            "#560bad", "#7209b7", "#b5179e", "#f72585"
        ]);
    
    const pie = d3.pie()
        .value(d => d.value)
        .sort(null);
    
    const arc = d3.arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius * 0.8);
    
    const outerArc = d3.arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9);
    
    const arcs = svg.selectAll("arc")
        .data(pie(categories))
        .enter()
        .append("g")
        .attr("class", "arc");
    
    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.name))
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.8)
        .on("mouseover", function() {
            d3.select(this).style("opacity", 1);
        })
        .on("mouseout", function() {
            d3.select(this).style("opacity", 0.8);
        })
        .transition()
        .duration(1000)
        .attrTween("d", function(d) {
            const interpolate = d3.interpolate({startAngle: 0, endAngle: 0}, d);
            return function(t) {
                return arc(interpolate(t));
            };
        });
    
    // Add labels with lines
    arcs.append("text")
        .attr("transform", function(d) {
            const pos = outerArc.centroid(d);
            const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            pos[0] = radius * 0.95 * (midAngle < Math.PI ? 1 : -1);
            return `translate(${pos})`;
        })
        .attr("dy", ".35em")
        .style("text-anchor", function(d) {
            const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            return midAngle < Math.PI ? "start" : "end";
        })
        .style("font-size", "10px")
        .style("fill", "#555")
        .text(function(d) {
            if (d.data.value > 0) {
                return `${d.data.name}: R$${d.data.value.toLocaleString('pt-BR')}`;
            }
            return "";
        })
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);
    
    // Add polylines between chart and labels
    arcs.append("polyline")
        .attr("points", function(d) {
            const pos = outerArc.centroid(d);
            const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            pos[0] = radius * 0.95 * (midAngle < Math.PI ? 1 : -1);
            return [arc.centroid(d), outerArc.centroid(d), pos];
        })
        .style("fill", "none")
        .style("stroke", "#ccc")
        .style("stroke-width", "1px")
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", function(d) {
            return d.data.value > 0 ? 0.8 : 0;
        });
    
    // If no data, show "No data" text
    if (categories.every(d => d.value === 0)) {
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .style("font-size", "14px")
            .style("fill", "#999")
            .text("Nenhum dado disponível");
    }
    
    return svg;
}

function createStatusChart(data) {
    const width = 250;
    const height = 250;
    const radius = Math.min(width, height) / 2;
    
    // Clear previous chart
    d3.select("#status-donut").html("");
    
    const svg = d3.select("#status-donut")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);
    
    const color = d3.scaleOrdinal()
        .domain(["Pago", "Pendente", "Atrasado"])
        .range(["#4caf50", "#ff9800", "#f44336"]);
    
    const pie = d3.pie()
        .value(d => d.value)
        .sort(null);
    
    const arc = d3.arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius * 0.8);
    
    const arcs = svg.selectAll("arc")
        .data(pie(data))
        .enter()
        .append("g")
        .attr("class", "arc");
    
    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.name))
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.8)
        .on("mouseover", function() {
            d3.select(this).style("opacity", 1);
        })
        .on("mouseout", function() {
            d3.select(this).style("opacity", 0.8);
        })
        .transition()
        .duration(1000)
        .attrTween("d", function(d) {
            const interpolate = d3.interpolate({startAngle: 0, endAngle: 0}, d);
            return function(t) {
                return arc(interpolate(t));
            };
        });
    
    // Add labels
    arcs.append("text")
        .attr("transform", function(d) {
            return `translate(${arc.centroid(d)})`;
        })
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "white")
        .style("font-weight", "bold")
        .text(function(d) {
            if (d.data.value > 0) {
                const percentage = (d.data.value / d3.sum(data, d => d.value) * 100).toFixed(1);
                return `${percentage}%`;
            }
            return "";
        })
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);
    
    // Add legend
    const legend = svg.selectAll(".legend")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {
            return `translate(${radius + 10}, ${-radius + 20 + i * 20})`;
        });
    
    legend.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", d => color(d.name))
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);
    
    legend.append("text")
        .attr("x", 20)
        .attr("y", 6)
        .attr("dy", ".35em")
        .style("font-size", "10px")
        .text(function(d) {
            return `${d.name}: R$${d.value.toLocaleString('pt-BR')}`;
        })
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);
    
    // If no data, show "No data" text
    if (data.every(d => d.value === 0)) {
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .style("font-size", "14px")
            .style("fill", "#999")
            .text("Nenhum dado disponível");
    }
    
    return svg;
}

function updateDashboardCharts(despesas) {
    // Data for category chart
    const categoryData = [
        { name: "Moradia", value: 0 },
        { name: "Transporte", value: 0 },
        { name: "Alimentação", value: 0 },
        { name: "Saúde", value: 0 },
        { name: "Educação", value: 0 },
        { name: "Lazer", value: 0 },
        { name: "Serviços", value: 0 },
        { name: "Outros", value: 0 }
    ];
    
    // Data for status chart
    const statusData = [
        { name: "Pago", value: 0 },
        { name: "Pendente", value: 0 },
        { name: "Atrasado", value: 0 }
    ];
    
    // Populate data
    despesas.forEach(d => {
        // Categories
        const categoria = d.categoria.charAt(0).toUpperCase() + d.categoria.slice(1);
        const categoryIndex = categoryData.findIndex(c => c.name.toLowerCase() === categoria.toLowerCase());
        if (categoryIndex !== -1) {
            categoryData[categoryIndex].value += parseFloat(d.valor);
        }
        
        // Status
        if (d.status === 'pago') {
            statusData[0].value += parseFloat(d.valor);
        } else if (estaVencida(d.data_vencimento)) {
            statusData[2].value += parseFloat(d.valor);
        } else {
            statusData[1].value += parseFloat(d.valor);
        }
    });
    
    // Create charts
    categoryChart = createCategoryChart(categoryData);
    statusChart = createStatusChart(statusData);
}