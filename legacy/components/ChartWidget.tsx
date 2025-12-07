import React, { useRef } from 'react';
import { Download } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { ChartConfig } from '../types';

interface ChartWidgetProps {
  config: ChartConfig;
}

const ChartWidget: React.FC<ChartWidgetProps> = ({ config }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!chartContainerRef.current) return;

    const svg = chartContainerRef.current.querySelector('svg');
    if (!svg) {
      console.error("Chart SVG not found");
      return;
    }

    // Get current size
    const { width, height } = svg.getBoundingClientRect();
    
    // Serialize SVG
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);

    // Ensure namespace for standalone usage
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    // Create Canvas
    const canvas = document.createElement('canvas');
    const scale = 2; // Increase scale for higher resolution
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white background (otherwise it's transparent)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Create Image from SVG
    const img = new Image();
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      // Trigger download
      const link = document.createElement('a');
      link.download = `${config.title.replace(/\s+/g, '_').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    img.src = url;
  };

  const renderChart = () => {
    switch (config.type) {
      case 'bar':
        return (
          <BarChart data={config.data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey={config.xAxisKey} tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
            <YAxis tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              cursor={{fill: '#f1f5f9'}}
            />
            <Legend />
            {config.series.map((s) => (
              <Bar key={s.dataKey} dataKey={s.dataKey} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={config.data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey={config.xAxisKey} tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
            <YAxis tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend />
            {config.series.map((s) => (
              <Line 
                key={s.dataKey} 
                type="monotone" 
                dataKey={s.dataKey} 
                name={s.name} 
                stroke={s.color} 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );
      case 'area':
        return (
            <AreaChart data={config.data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={config.xAxisKey} tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend />
              {config.series.map((s) => (
                <Area 
                  key={s.dataKey} 
                  type="monotone" 
                  dataKey={s.dataKey} 
                  name={s.name} 
                  stroke={s.color} 
                  fill={s.color} 
                  fillOpacity={0.2}
                />
              ))}
            </AreaChart>
          );
      case 'pie':
        // For Pie charts, we typically use the first series value
        const seriesKey = config.series[0]?.dataKey;
        return (
          <PieChart>
             <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend />
            <Pie
              data={config.data}
              dataKey={seriesKey}
              nameKey={config.xAxisKey} // Use X-Axis key as the label (name) for pie slices
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              label
            >
              {config.data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={config.series[index % config.series.length]?.color || '#8884d8'} 
                />
              ))}
            </Pie>
          </PieChart>
        );
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 my-4 group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{config.title}</h3>
          {config.description && <p className="text-sm text-slate-500">{config.description}</p>}
        </div>
        <button
          onClick={handleDownload}
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Download Chart as Image"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>
      <div ref={chartContainerRef} className="h-80 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartWidget;