import React, { useEffect, useRef } from "react";
import { PlayerState } from "../types";
import * as d3 from "d3";

interface StatsProps {
  playerState: PlayerState;
}

export default function Stats({ playerState }: StatsProps) {
  const radarRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!radarRef.current || playerState.history.length === 0) return;

    // Draw Radar Chart
    const radarData = [
      { axis: "Nhận biết", value: 0.8 },
      { axis: "Hiểu", value: 0.6 },
      { axis: "Vận dụng", value: 0.7 },
      { axis: "Phân tích", value: 0.5 },
      { axis: "Sáng tạo", value: 0.9 }
    ];
    // Dummy calculation based on playerState.history can be placed here

    const drawRadar = () => {
      d3.select(radarRef.current).selectAll("*").remove();
      const width = 350;
      const height = 350;
      const radius = Math.min(width, height) / 2 - 50;
      const svg = d3.select(radarRef.current).append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

      const rScale = d3.scaleLinear().range([0, radius]).domain([0, 1]);
      const angleSlice = (Math.PI * 2) / radarData.length;

      // Draw grid
      const axisGrid = svg.append("g").attr("class", "axisWrapper");
      [0.2, 0.4, 0.6, 0.8, 1].forEach((level) => {
        axisGrid.append("circle")
          .attr("r", rScale(level))
          .style("fill", "#1E293B")
          .style("stroke", "#334155")
          .style("fill-opacity", 0.3);
      });

      // Draw axes
      const axis = axisGrid.selectAll(".axis")
        .data(radarData)
        .enter()
        .append("g")
        .attr("class", "axis");

      axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => rScale(1.1) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y2", (d, i) => rScale(1.1) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("class", "line")
        .style("stroke", "#475569")
        .style("stroke-width", "1px");

      axis.append("text")
        .attr("class", "legend")
        .style("font-size", "12px")
        .style("fill", "#cbd5e1")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", (d, i) => rScale(1.2) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y", (d, i) => rScale(1.2) * Math.sin(angleSlice * i - Math.PI / 2))
        .text((d) => d.axis);

      // Draw radar area
      const radarLine = d3.lineRadial<{ axis: string; value: number }>()
        .angle((d, i) => i * angleSlice)
        .radius((d) => rScale(d.value))
        .curve(d3.curveLinearClosed);

      svg.append("path")
        .datum(radarData)
        .attr("d", radarLine)
        .style("fill", "rgba(56, 189, 248, 0.4)")
        .style("stroke", "#38BDF8")
        .style("stroke-width", 2);
    };

    drawRadar();
  }, [playerState.history]);

  useEffect(() => {
    if (!lineRef.current || playerState.history.length === 0) return;

    // Line chart for XP / Score progression
    const drawLine = () => {
      d3.select(lineRef.current).selectAll("*").remove();
      const margin = { top: 20, right: 30, bottom: 30, left: 40 };
      const width = 450 - margin.left - margin.right;
      const height = 300 - margin.top - margin.bottom;

      const svg = d3.select(lineRef.current)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Mock data based on history
      const data = playerState.history.map((h, i) => ({
        id: i,
        score: h.isCorrect ? 10 : 0
      }));
      let runningScore = 0;
      const cumulative = data.map(d => {
        runningScore += d.score;
        return { ...d, cumulative: runningScore };
      });

      const x = d3.scaleLinear().domain([0, cumulative.length - 1]).range([0, width]);
      const y = d3.scaleLinear().domain([0, d3.max(cumulative, d => d.cumulative) || 100]).range([height, 0]);

      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(Math.min(cumulative.length, 5)).tickFormat(d => `#${d + 1}`))
        .attr("color", "#64748b");

      svg.append("g")
        .call(d3.axisLeft(y))
        .attr("color", "#64748b");

      svg.append("path")
        .datum(cumulative)
        .attr("fill", "none")
        .attr("stroke", "#8b5cf6") // purple-500
        .attr("stroke-width", 3)
        .attr("d", d3.line<{ id: number; cumulative: number }>()
          .x(d => x(d.id))
          .y(d => y(d.cumulative))
          .curve(d3.curveMonotoneX)
        );
    };
    drawLine();
  }, [playerState.history]);

  if (playerState.history.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p>Bạn chưa tham gia bất kỳ chiến dịch nào để hiển thị dữ liệu thống kê.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-white mb-8 text-center font-display tracking-tight">Hồ Sơ Năng Lực Ma Thuật</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 flex flex-col items-center shadow-lg">
          <h3 className="text-xl font-bold text-sky-400 mb-4">Lục Giác Kỹ Năng</h3>
          <div ref={radarRef} className="w-full flex justify-center overflow-hidden" />
        </div>
        
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 flex flex-col items-center shadow-lg">
          <h3 className="text-xl font-bold text-purple-400 mb-4">Tiến Trình Tu Luyện XP</h3>
          <div ref={lineRef} className="w-full overflow-hidden overflow-x-auto flex justify-center" />
        </div>
      </div>
    </div>
  );
}
