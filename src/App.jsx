import React, { useState, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatRs = (n) => {
  const num = Number(n);
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const SummaryCard = ({ label, value, sub }) => (
  <div className="card" style={{ minHeight: 96 }}>
    <div className="label">{label}</div>
    <div className="value">{value}</div>
    {sub && <div className="delta">{sub}</div>}
  </div>
);

export default function App() {
  const [tab, setTab] = useState('gst');
  const [gstInput, setGstInput] = useState({ amount: '', rate: 18 });
  const [taxInput, setTaxInput] = useState({ income: '', regime: 'new', age: '<60', deductions: 0 });
  const [businessMoney, setBusinessMoney] = useState({ revenue: 450000, cogs: 180000, opex: 95000, gstCollected: 40500 });
  const [invoice, setInvoice] = useState({ seller: '', buyer: '', items: '', date: new Date().toISOString().slice(0, 10) });
  const [saved, setSaved] = useState({ gst: [], tax: [], inv: [] });

  const gstCalc = useCallback((amount, rate) => {
    const a = parseFloat(amount);
    const r = parseFloat(rate) || 0;
    if (isNaN(a) || a < 0) return null;
    const g = a * (r / 100);
    const total = a + g;
    return { base: a, rate: r, gst: g, total, cgst: g / 2, sgst: g / 2 };
  }, []);

  const calcGstOut = useMemo(() => gstCalc(gstInput.amount, gstInput.rate), [gstInput.amount, gstInput.rate]);
  const isValidGstInput = useMemo(() => calcGstOut !== null, [calcGstOut]);

  const saveGst = useCallback(() => {
    if (!calcGstOut) return;
    setSaved((s) => {
      const already = s.gst.find((g) => g.base === calcGstOut.base && g.rate === calcGstOut.rate);
      if (already) return s;
      return { ...s, gst: [...s.gst, calcGstOut] };
    });
  }, [calcGstOut]);

  const handleGstAmountChange = useCallback((e) => {
    const value = e.target.value.trim();
    if (value === '' || (!isNaN(value) && Number(value) >= 0)) {
      setGstInput((prev) => ({ ...prev, amount: value }));
    }
  }, []);

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

  const invoices = invoice.items.split('\n').filter(Boolean).map((line) => {
    const parts = line.includes('|') ? line.split('|') : [line];
    return { item: (parts[0] || '').trim(), amt: parseFloat((parts[1] || '').replace(/[^0-9.]/g, '')) || 0 };
  });
  const invoiceTotal = invoices.reduce((sum, x) => sum + x.amt, 0);

  return (
    <div className="wrap">
      <div className="topbar">
        <div className="logo">BizKit India · Small Business Toolkit</div>
        <div className="pill">MVP build · experimental</div>
      </div>

      <div className="help">
        <div className="help-item">
          <h4><span className="marker">R</span>Research</h4>
          <p>Verified workflow for Indian small-business tooling: GST, invoicing, income tax, and cash-flow.</p>
        </div>
        <div className="help-item">
          <h4><span className="marker">G</span>Goal</h4>
          <p>Ship one coherent MVP with clear, consistent UX across calculators and reporting.</p>
        </div>
        <div className="help-item">
          <h4><span className="marker">M</span>Monetization</h4>
          <p>Free core tools; future Pro tier: unlimited exports, history, PDF exports, and team seats.</p>
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="Tool tabs">
        {['gst', 'invoice', 'tax', 'dashboard'].map((key) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className={`tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            {key === 'gst' && 'GST calculator'}
            {key === 'invoice' && 'Invoice generator'}
            {key === 'tax' && 'Income tax'}
            {key === 'dashboard' && 'Profit dashboard'}
          </button>
        ))}
      </div>

      {tab === 'gst' && (
        <section className="section" aria-labelledby="gst-heading">
          <h2 id="gst-heading">GST calculator</h2>
          <div className="card">
            <div className="input-row">
              <div>
                <label className="label" htmlFor="gst-amount">Amount (₹)</label>
                <input id="gst-amount" className="input" type="number" value={gstInput.amount} onChange={handleGstAmountChange} />
                {gstInput.amount !== '' && !isValidGstInput && (
                  <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 4 }}>Enter a valid positive number.</div>
                )}
              </div>
              <div>
                <label className="label" htmlFor="gst-rate">GST rate (%)</label>
                <select id="gst-rate" value={gstInput.rate} onChange={(e) => setGstInput((s) => ({ ...s, rate: Number(e.target.value) }))}>
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn secondary" onClick={() => setGstInput({ amount: '', rate: 0 })}>Reset</button>
              </div>
            </div>
            {calcGstOut ? (
              <div className="result">
                <div className="grid-3">
                  <div>
                    <div className="label">Base amount</div>
                    <div className="heading">{formatRs(calcGstOut.base)}</div>
                    <div className="label">CGST {calcGstOut.rate / 2}%</div>
                    <div className="heading">{formatRs(calcGstOut.cgst)}</div>
                    <div className="label">SGST {calcGstOut.rate / 2}%</div>
                    <div className="heading">{formatRs(calcGstOut.sgst)}</div>
                  </div>
                  <div>
                    <div className="label">Total GST</div>
                    <div className="heading">{formatRs(calcGstOut.gst)}</div>
                    <div className="label">Rate</div>
                    <div className="heading">{calcGstOut.rate}%</div>
                  </div>
                  <div>
                    <div className="label">Total payable</div>
                    <div className="heading">{formatRs(calcGstOut.total)}</div>
                  </div>
                </div>
                <div className="btn-wrap">
                  <button className="btn" onClick={saveGst}>Save</button>
                  <button className="btn secondary" onClick={downloadGst}>Download JSON</button>
                  <span className="badge">{saved.gst.length} saved</span>
                </div>
              </div>
            ) : (
              <div className="result">
                <div className="empty">
                  <div className="empty-title">GST breakdown</div>
                  <div>Enter an amount and rate to calculate CGST / SGST and total payable.</div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {tab === 'tax' && (
        <section className="section" aria-labelledby="tax-heading">
          <h2 id="tax-heading">Income Tax Estimator (India FY 2025-26)</h2>
          <div className="card">
            <div className="input-row">
              <div>
                <label className="label" htmlFor="tax-income">Annual income (₹)</label>
                <input id="tax-income" className="input" type="number" value={taxInput.income} onChange={(e) => setTaxInput((s) => ({ ...s, income: e.target.value }))} />
              </div>
              <div>
                <label className="label" htmlFor="tax-regime">Regime</label>
                <select id="tax-regime" value={taxInput.regime} onChange={(e) => setTaxInput((s) => ({ ...s, regime: e.target.value }))}>
                  <option value="new">New Regime</option>
                  <option value="old">Old Regime</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="tax-age">Age</label>
                <select id="tax-age" value={taxInput.age} onChange={(e) => setTaxInput((s) => ({ ...s, age: e.target.value }))}>
                  <option value="<60">Below 60</option>
                  <option value="60-80">60 - 80</option>
                  <option value=">80">Above 80</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="tax-deduct">Other deductions / sec 80C etc (₹)</label>
              <input id="tax-deduct" className="input" type="number" value={taxInput.deductions} onChange={(e) => setTaxInput((s) => ({ ...s, deductions: e.target.value }))} />
            </div>
            <div className="result">
              <div className="grid-3">
                <div>
                  <div className="label">Taxable income</div>
                  <div className="heading">{formatRs(taxInput.regime === 'old' ? Math.max(taxIncome - taxDeductions, 0) : taxIncome)}</div>
                </div>
                <div>
                  <div className="label">Income tax + cess</div>
                  <div className="heading">{formatRs(totalTax)}</div>
                </div>
                <div>
                  <div className="label">Effective rate</div>
                  <div className="heading">{taxIncome > 0 ? `${((totalTax / taxIncome) * 100).toFixed(2)}%` : '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {tab === 'invoice' && (
        <section className="section" aria-labelledby="invoice-heading">
          <h2 id="invoice-heading">Simple invoice generator</h2>
          <div className="card">
            <div className="input-row">
              <div>
                <label className="label" htmlFor="inv-seller">Seller / your name</label>
                <input id="inv-seller" className="input" value={invoice.seller} onChange={(e) => setInvoice((s) => ({ ...s, seller: e.target.value }))} />
              </div>
              <div>
                <label className="label" htmlFor="inv-buyer">Client / buyer name</label>
                <input id="inv-buyer" className="input" value={invoice.buyer} onChange={(e) => setInvoice((s) => ({ ...s, buyer: e.target.value }))} />
              </div>
              <div>
                <label className="label" htmlFor="inv-date">Invoice date</label>
                <input id="inv-date" className="input" type="date" value={invoice.date} onChange={(e) => setInvoice((s) => ({ ...s, date: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="inv-items">Line items — one per line as "Description | Amount"</label>
              <textarea
                id="inv-items"
                className="input"
                value={invoice.items}
                rows={5}
                style={{ fontFamily: 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace' }}
                placeholder={'Website maintenance | 15000\nDesign | 8000\nHosting | 2000'}
                onChange={(e) => setInvoice((s) => ({ ...s, items: e.target.value }))}
              />
            </div>
            {invoice.items.trim().length > 0 ? (
              <div className="result">
                <div className="heading">{invoice.seller || 'Seller'} · to · {invoice.buyer || 'Client'}</div>
                <div className="meta">Invoice date: {invoice.date}</div>
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((line, idx) => (
                      <tr key={idx}>
                        <td>{line.item}</td>
                        <td style={{ textAlign: 'right' }}>{formatRs(line.amt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="invoice-total">Total: {formatRs(invoiceTotal)}</div>
              </div>
            ) : (
              <div className="result">
                <div className="empty">
                  <div className="empty-title">Invoice preview</div>
                  <div>Add line items above to see a quick invoice summary.</div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {tab === 'dashboard' && (
        <section className="section" aria-labelledby="dash-heading">
          <h2 id="dash-heading">Profit dashboard</h2>
          <div className="kpi">
            <SummaryCard label="Revenue" value={formatRs(businessMoney.revenue)} sub="This run" />
            <SummaryCard label="Net profit" value={formatRs(netProfit)} sub={`${margin.toFixed(1)}% margin`} />
            <SummaryCard label="GST liability" value={formatRs(businessMoney.gstCollected)} sub="Outflow" />
            <SummaryCard label="Est. EBITDA" value={formatRs(ebitda)} sub="COGS/opex mix based" />
          </div>
          <div className="card">
            <div className="input-row">
              <div>
                <label className="label" htmlFor="d-revenue">Revenue (₹)</label>
                <input id="d-revenue" className="input" type="number" value={businessMoney.revenue} onChange={(e) => setBusinessMoney((s) => ({ ...s, revenue: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="label" htmlFor="d-cogs">COGS / goods (₹)</label>
                <input id="d-cogs" className="input" type="number" value={businessMoney.cogs} onChange={(e) => setBusinessMoney((s) => ({ ...s, cogs: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="label" htmlFor="d-opex">OpEx (₹)</label>
                <input id="d-opex" className="input" type="number" value={businessMoney.opex} onChange={(e) => setBusinessMoney((s) => ({ ...s, opex: Number(e.target.value) }))} />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="4 4" stroke="#efefe9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b717d' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b717d' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(val) => formatRs(val)} />
                <Line type="monotone" dataKey="revenue" stroke="#0f562e" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="cogs" stroke="#c27a3b" strokeWidth={2} name="COGS" />
                <Line type="monotone" dataKey="opex" stroke="#3b6ec2" strokeWidth={2} name="OpEx" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <footer className="footer">
        <div>BizKit India · built with React + Vite</div>
        <div>Static build. No server-side storage.</div>
      </footer>
    </div>
  );
}
