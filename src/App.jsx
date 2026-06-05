import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatRs = (n) => {
  const num = Number(n);
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const SummaryCard = ({ label, value, sub }) => (
  <div className="card" style={{ minHeight: 96 }}>
    <h3>{label}</h3>
    <div className="value">{value}</div>
    {sub && <div className="delta">{sub}</div>}
  </div>
);

export default function App() {
  const [tab, setTab] = useState('gst');
  const [gstInput, setGstInput] = useState({ amount: '', rate: 18 });
  const [taxInput, setTaxInput] = useState({ income: '', regime: 'new', age: '<60', deductions: 0 });
  const [businessMoney, setBusinessMoney] = useState({ revenue: 450000, cogs: 180000, opex: 95000, gstCollected: 40500 });
  const [saved, setSaved] = useState({ gst: [], tax: [], inv: [] });

  const gstCalc = (amount, rate) => {
    const a = parseFloat(amount);
    const r = parseFloat(rate) || 0;
    if (isNaN(a) || a < 0) return null;
    const g = a * (r / 100);
    const total = a + g;
    return { base: a, rate: r, gst: g, total, cgst: g / 2, sgst: g / 2 };
  };

  const calcGstOut = gstCalc(gstInput.amount, gstInput.rate);
  if (calcGstOut) {
    const already = saved.gst.find((g) => g.base === calcGstOut.base && g.rate === calcGstOut.rate);
    if (!already) setSaved((s) => ({ ...s, gst: [...s.gst, calcGstOut] }));
  }

  const taxIncome = parseFloat(taxInput.income) || 0;
  const taxDeductions = parseFloat(taxInput.deductions) || 0;
  let incomeTax = 0;

  if (taxIncome > 0) {
    const taxable = taxInput.regime === 'old' ? Math.max(taxIncome - taxDeductions, 0) : taxIncome;
    if (taxInput.regime === 'old') {
      if (taxable <= 250000) incomeTax = 0;
      else if (taxable <= 500000) incomeTax = (taxable - 250000) * 0.05;
      else if (taxable <= 1000000) incomeTax = 25000 + (taxable - 500000) * 0.2;
      else incomeTax = 125000 + (taxable - 1000000) * 0.3;
    } else {
      if (taxable <= 300000) incomeTax = 0;
      else if (taxable <= 600000) incomeTax = (taxable - 300000) * 0.05;
      else if (taxable <= 900000) incomeTax = 15000 + (taxable - 600000) * 0.1;
      else if (taxable <= 1200000) incomeTax = 45000 + (taxable - 900000) * 0.15;
      else if (taxable <= 1500000) incomeTax = 90000 + (taxable - 1200000) * 0.2;
      else incomeTax = 150000 + (taxable - 1500000) * 0.3;
    }
  }
  const cessIncome = incomeTax * 0.04;
  const totalTax = incomeTax + cessIncome;

  const netProfit = businessMoney.revenue - businessMoney.cogs - businessMoney.opex;
  const ebitda = netProfit + businessMoney.cogs * 0.35;
  const margin = businessMoney.revenue > 0 ? (netProfit / businessMoney.revenue) * 100 : 0;
  const trend = [
    { month: 'Jul', revenue: 420000, cogs: 170000, opex: 90000 },
    { month: 'Aug', revenue: 435000, cogs: 178000, opex: 92000 },
    { month: 'Sep', revenue: 430000, cogs: 175000, opex: 91000 },
    { month: 'Oct', revenue: 440000, cogs: 180000, opex: 94000 },
    { month: 'Nov', revenue: 460000, cogs: 186000, opex: 96000 },
    { month: 'Dec', revenue: 480000, cogs: 192000, opex: 98000 },
  ];

  const downloadGst = () => {
    if (!calcGstOut) return;
    const blob = new Blob([JSON.stringify(calcGstOut, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gst-calculation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="wrap">
      <div className="topbar">
        <div className="logo">BizKit India • Small Business Toolkit</div>
        <div className="pill">Ind