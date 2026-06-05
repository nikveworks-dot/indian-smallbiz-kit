import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatRs = (n) => {
  const num = Number(n);
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const SummaryCard = ({ label, value, sub }) => (
  <motion.div
    className="box"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: 'spring', stiffness: 320, damping: 24, mass: 0.8 }}
  >
    <div className="label">{label}</div>
    <div className="value">{value}</div>
    {sub && <div className="delta">{sub}</div>}
  </motion.div>
);

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, when: 'beforeChildren' },
  },
};

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

  const pageVariants = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  const panelTransition = {
    type: 'spring',
    stiffness: 260,
    damping: 22,
    mass: 0.9,
  };

  const microButton = {
    whileHover: { y: -1 },
    whileTap: { scale: 0.985 },
    transition: { type: 'spring', stiffness: 340, damping: 18 },
  };

  return (
    <motion.div className="wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
      <div className="topbar">
        <div className="logo">BizKit India · Small Business Toolkit</div>
        <div className="pill">MVP build · experimental</div>
      </div>

      <motion.div className="help" variants={container} initial="hidden" animate="show">
        {[
          {
            letter: 'R',
            title: 'Research',
            text: 'Verified workflow for Indian small-business tooling: GST, invoicing, income tax, and cash-flow.',
          },
          {
            letter: 'G',
            title: 'Goal',
            text: 'Ship one coherent MVP with clear, consistent UX across calculators and reporting.',
          },
          {
            letter: 'M',
            title: 'Monetization',
            text: 'Free core tools; future Pro tier: unlimited exports, history, PDF exports, and team seats.',
          },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            className="help-item"
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          >
            <h4>
              <span className="marker">{item.letter}</span>
              {item.title}
            </h4>
            <p>{item.text}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="tabs" role="tablist" aria-label="Tool tabs">
        {['gst', 'invoice', 'tax', 'dashboard'].map((key) => (
          <motion.button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`tab ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            {key === 'gst' && 'GST calculator'}
            {key === 'invoice' && 'Invoice generator'}
            {key === 'tax' && 'Income tax'}
            {key === 'dashboard' && 'Profit dashboard'}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'gst' && (
          <motion.section
            key="gst"
            className="section"
            aria-labelledby="gst-heading"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={panelTransition}
          >
            <h2 id="gst-heading">GST calculator</h2>
            <motion.div className="card" whileHover={{ y: -1 }} transition={{ duration: 0.2 }}>
              <div className="input-row">
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
                  <label className="label" htmlFor="gst-amount">Amount (₹)</label>
                  <motion.input
                    id="gst-amount"
                    className="input"
                    type="number"
                    value={gstInput.amount}
                    onChange={handleGstAmountChange}
                    whileFocus={{ scale: 1.005 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  />
                  {gstInput.amount !== '' && !isValidGstInput && (
                    <div className="field-error">Enter a valid positive number.</div>
                  )}
                </motion.div>
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                  <label className="label" htmlFor="gst-rate">GST rate (%)</label>
                  <select
                    id="gst-rate"
                    value={gstInput.rate}
                    onChange={(e) => setGstInput((s) => ({ ...s, rate: Number(e.target.value) }))}
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </motion.div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <motion.button
                    className="btn secondary"
                    onClick={() => setGstInput({ amount: '', rate: 0 })}
                    {...microButton}
                  >
                    Reset
                  </motion.button>
                </div>
              </div>
              <AnimatePresence>
                {calcGstOut ? (
                  <motion.div
                    key="gst-result"
                    className="result"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  >
                    <div className="grid-3">
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
                        <div className="label">Base amount</div>
                        <div className="heading" style={{ fontSize: 18 }}>{formatRs(calcGstOut.base)}</div>
                        <div className="label" style={{ marginTop: 6 }}>CGST {calcGstOut.rate / 2}%</div>
                        <div className="heading">{formatRs(calcGstOut.cgst)}</div>
                        <div className="label" style={{ marginTop: 6 }}>SGST {calcGstOut.rate / 2}%</div>
                        <div className="heading">{formatRs(calcGstOut.sgst)}</div>
                      </motion.div>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        <div className="label">Total GST</div>
                        <div className="heading" style={{ fontSize: 18 }}>{formatRs(calcGstOut.gst)}</div>
                        <div className="label" style={{ marginTop: 6 }}>Rate</div>
                        <div className="heading">{calcGstOut.rate}%</div>
                      </motion.div>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                        <div className="label">Total payable</div>
                        <div className="heading" style={{ fontSize: 20 }}>{formatRs(calcGstOut.total)}</div>
                      </motion.div>
                    </div>
                    <div className="btn-wrap">
                      <motion.button className="btn" onClick={saveGst} {...microButton}>
                        Save
                      </motion.button>
                      <motion.button className="btn secondary" onClick={downloadGst} {...microButton}>
                        Download JSON
                      </motion.button>
                      <span className="badge">{saved.gst.length} saved</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="gst-empty"
                    className="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    <div className="empty">
                      <div className="empty-title">GST breakdown</div>
                      <div>Enter an amount and rate to calculate CGST / SGST and total payable.</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.section>
        )}

        {tab === 'invoice' && (
          <motion.section
            key="invoice"
            className="section"
            aria-labelledby="invoice-heading"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={panelTransition}
          >
            <h2 id="invoice-heading">Simple invoice generator</h2>
            <motion.div className="card" whileHover={{ y: -1 }} transition={{ duration: 0.2 }}>
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
              <AnimatePresence>
                {invoice.items.trim().length > 0 ? (
                  <motion.div
                    key="inv-result"
                    className="result"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  >
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
                          <motion.tr
                            key={idx}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.04 }}
                          >
                            <td>{line.item}</td>
                            <td style={{ textAlign: 'right' }}>{formatRs(line.amt)}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="invoice-total">Total: {formatRs(invoiceTotal)}</div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="inv-empty"
                    className="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    <div className="empty">
                      <div className="empty-title">Invoice preview</div>
                      <div>Add line items above to see a quick invoice summary.</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.section>
        )}

        {tab === 'tax' && (
          <motion.section
            key="tax"
            className="section"
            aria-labelledby="tax-heading"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={panelTransition}
          >
            <h2 id="tax-heading">Income Tax Estimator (India FY 2025-26)</h2>
            <motion.div className="card" whileHover={{ y: -1 }} transition={{ duration: 0.2 }}>
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
            </motion.div>
          </motion.section>
        )}

        {tab === 'dashboard' && (
          <motion.section
            key="dashboard"
            className="section"
            aria-labelledby="dash-heading"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={panelTransition}
          >
            <h2 id="dash-heading">Profit dashboard</h2>
            <motion.div className="kpi" variants={container} initial="hidden" animate="show">
              <SummaryCard label="Revenue" value={formatRs(businessMoney.revenue)} sub="This run" />
              <SummaryCard label="Net profit" value={formatRs(netProfit)} sub={`${margin.toFixed(1)}% margin`} />
              <SummaryCard label="GST liability" value={formatRs(businessMoney.gstCollected)} sub="Outflow" />
              <SummaryCard label="Est. EBITDA" value={formatRs(ebitda)} sub="COGS/opex mix based" />
            </motion.div>
            <motion.div className="card" whileHover={{ y: -1 }} transition={{ duration: 0.2 }}>
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
                  <CartesianGrid strokeDasharray="4 4" stroke="#eef0f3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(val) => formatRs(val)} contentStyle={{ borderRadius: 10, border: '1px solid #eef0f3', fontSize: 13, fontFamily: 'inherit' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2.5} name="Revenue" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="cogs" stroke="#c27a3b" strokeWidth={2.5} name="COGS" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="opex" stroke="#3b6ec2" strokeWidth={2.5} name="OpEx" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>

      <footer className="footer">
        <div>BizKit India · built with React + Vite</div>
        <div>Static build. No server-side storage.</div>
      </footer>
    </motion.div>
  );
}
