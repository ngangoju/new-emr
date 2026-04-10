import re

with open('src/components/billing/BillingDashboard.tsx', 'r') as f:
    content = f.read()

pattern = re.compile(
    r'(<Dialog open={!!detailsInvoice} onOpenChange={\(open\) => !open && closeDetailsDialog\(\)}>\s+<DialogContent className="max-w-4xl">.*?<\/DialogContent>\s+<\/Dialog>)',
    re.DOTALL
)

match = pattern.search(content)

if match:
    old_code = match.group(0)
    
    new_code = '''<Dialog open={!!detailsInvoice} onOpenChange={(open) => !open && closeDetailsDialog()}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-slate-50 border-none shadow-2xl sm:rounded-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              Read-only invoice format for billing review.
            </DialogDescription>
          </DialogHeader>

          {detailsInvoice ? (
            <div className="flex max-h-[85vh] flex-col overflow-y-auto">
              {/* Premium Header */}
              <div className="relative bg-white px-8 py-10 shadow-[0_1px_3px_0_rgb(0,0,0,0.05)] border-b border-slate-100 z-10">
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Invoice Format</p>
                    <div className="mt-3 flex items-center gap-3">
                      <h3 className="font-mono text-3xl font-semibold tracking-tight text-slate-900">
                        #{detailsInvoice.invoiceNumber || detailsInvoice.id.slice(0, 8)}
                      </h3>
                      <Badge variant="outline" className="border-slate-200 bg-slate-50/50 text-slate-600 uppercase tracking-widest text-[9px] shadow-sm">
                        {detailsInvoice.paymentStatus || detailsInvoice.status}
                      </Badge>
                      {typeof detailsInvoice.discountAmount === 'number' && detailsInvoice.discountAmount > 0 ? (
                        <Badge className="border-none bg-emerald-50 text-emerald-600 uppercase tracking-widest text-[9px] shadow-sm">Discount Applied</Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Generated {format(new Date(detailsInvoice.createdAt), 'PPP p')}
                    </p>
                  </div>
                  <div className="text-right">
                     <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Total Amount</p>
                     <p className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
                       <span className="text-2xl text-slate-400 font-medium mr-1">RWF</span>
                       {detailsTotal.toLocaleString()}
                     </p>
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="flex flex-col gap-6 p-8 bg-slate-50/50">
                {/* Context Cards */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Patient Info Card */}
                  <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
                    <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-br from-blue-500 to-transparent w-full h-full pointer-events-none" />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-4 ring-blue-50/50">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Patient Details</p>
                      </div>
                      <p className="text-xl font-semibold text-slate-900">{detailsInvoice.patient?.fullName || 'Unknown Patient'}</p>
                      <div className="mt-4 space-y-2.5">
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">National ID</span> 
                          <span className="text-sm font-semibold text-slate-700">{detailsInvoice.patient?.nationalId || 'Not recorded'}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Phone</span> 
                          <span className="text-sm font-semibold text-slate-700">{detailsInvoice.patient?.phone || 'Not recorded'}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Insurance</span> 
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{detailsInvoice.patient?.insurance?.provider || 'Self pay'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Encounter Info Card */}
                  <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
                    <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-bl from-purple-500 to-transparent w-full h-full pointer-events-none" />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-purple-600 ring-4 ring-purple-50/50">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Encounter Context</p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                           <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Attending Doctor</span>
                           <p className="text-sm font-semibold text-slate-900">{detailsInvoice.doctorName || (detailsInvoice.doctorId ? `Dr. ${detailsInvoice.doctorId.slice(0, 8)}` : 'Not assigned')}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="flex flex-col gap-1 rounded-lg bg-slate-50 p-2.5 border border-slate-100/50">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Consultation</span>
                            <p className="text-xs font-semibold text-slate-700 truncate">{detailsInvoice.consultationId || 'Not linked'}</p>
                          </div>
                          <div className="flex flex-col gap-1 rounded-lg bg-slate-50 p-2.5 border border-slate-100/50">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Lab Order</span>
                            <p className="text-xs font-semibold text-slate-700 truncate">{detailsInvoice.labOrderId || 'Not linked'}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Last Updated</span>
                            <span className="text-xs font-medium text-slate-500">{format(new Date(detailsInvoice.updatedAt), 'PPP p')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4 flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Itemized Services</p>
                    <Badge variant="secondary" className="bg-white hover:bg-slate-50 text-slate-600 text-[10px] uppercase font-bold tracking-widest border border-slate-200 shadow-sm">
                      {detailsInvoice.items.length} {detailsInvoice.items.length === 1 ? 'Item' : 'Items'}
                    </Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm w-full">
                      <thead className="bg-white text-slate-400">
                        <tr>
                          <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider border-b border-slate-100/50">Service Description</th>
                          <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider border-b border-slate-100/50 w-24">Qty</th>
                          <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider border-b border-slate-100/50 w-32">Unit Price</th>
                          <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider border-b border-slate-100/50 w-40">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 bg-white">
                         {detailsInvoice.items.length ? detailsInvoice.items.map((item, index) => (
                          <tr key={item.id || `${item.tariffId}-${index}`} className="group transition-colors hover:bg-slate-50/50">
                            <td className="px-6 py-4">
                              <p className="font-medium text-slate-900">{item.tariff?.serviceName || item.tariff?.billingCode || 'Unnamed service'}</p>
                              {item.tariff?.billingCode && <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.tariff.billingCode}</p>}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md bg-slate-100 px-2 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200/50">
                                {item.quantity}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-slate-600">
                               {item.unitPrice.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="font-semibold text-slate-900">{item.total.toLocaleString()}</span>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center justify-center space-y-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                                   <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 12H4M20 16H4M20 8H4" /></svg>
                                </div>
                                <span className="text-sm font-medium text-slate-500">No invoice items recorded.</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom Section: Payments & Totals */}
                <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                  {/* Payments */}
                  <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm flex flex-col">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-5">Payment History</p>
                    <div className="flex-1 space-y-3">
                      {detailsPayments.length ? detailsPayments.map((payment) => (
                        <div key={payment.id} className="relative flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-slate-900">
                                RWF {payment.amount.toLocaleString()} 
                                </p>
                                <span className="inline-flex items-center rounded-md bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-500 shadow-sm border border-slate-100">
                                    {payment.paymentMethod.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between">
                                <p className="text-[11px] font-medium text-slate-500">
                                {format(new Date(payment.paidAt), 'PPP p')}
                                </p>
                                <div className="flex gap-2">
                                  {payment.receiptNumber && (
                                    <p className="text-[10px] text-slate-400">RCPT: <span className="text-slate-600 font-medium">{payment.receiptNumber}</span></p>
                                  )}
                                  {payment.paidBy && (
                                    <p className="text-[10px] text-slate-400">By: <span className="text-slate-600 font-medium">{payment.paidBy}</span></p>
                                  )}
                                </div>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="flex h-full min-h-[140px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 mb-3">
                             <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                          </div>
                          <p className="text-sm font-medium text-slate-600">No payments recorded</p>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">Any recorded payments for this invoice will appear here.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Totals Summary */}
                  <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-6">Summary Totals</p>
                        <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-500">Subtotal</span>
                            <span className="text-sm font-semibold text-slate-900">RWF {detailsSubtotal.toLocaleString()}</span>
                        </div>
                        {detailsDiscount > 0 && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-500">Discount</span>
                                <span className="text-sm font-semibold text-emerald-600">- RWF {detailsDiscount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-500">Insurance Due</span>
                            <span className="text-sm font-semibold text-slate-900">RWF {detailsInsuranceDue.toLocaleString()}</span>
                        </div>
                        </div>

                        {detailsInvoice.discountReason && (
                        <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-3.5">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600/70 mb-1.5 flex items-center gap-1.5">
                               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                               Discount Applied
                            </p>
                            <p className="text-xs font-medium text-emerald-800 leading-relaxed">{detailsInvoice.discountReason}</p>
                        </div>
                        )}
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-100">
                        <div className="flex items-end justify-between">
                            <div>
                                <span className="block text-[11px] font-bold uppercase tracking-widest text-slate-400">Total Patient Due</span>
                                {detailsPatientDue > 0 ? (
                                    <span className="mt-1 inline-flex items-center text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">Action Required</span>
                                ) : (
                                    <span className="mt-1 inline-flex items-center text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Fully Paid</span>
                                )}
                            </div>
                            <span className="text-3xl font-bold tracking-tight text-slate-900">RWF {detailsPatientDue.toLocaleString()}</span>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Sticky Footer */}
              <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-slate-100 bg-white/80 p-6 backdrop-blur-xl">
                <Button variant="outline" className="font-semibold px-6 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50" onClick={closeDetailsDialog}>Close Preview</Button>
                {detailsPatientDue > 0 && (
                  <Button className="font-semibold px-6 shadow-md" onClick={() => {
                    closeDetailsDialog()
                    handleProcessPayment(detailsInvoice)
                  }}>
                    Process Payment
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>'''
    
    updated_content = content.replace(old_code, new_code)
    
    with open('src/components/billing/BillingDashboard.tsx', 'w') as f:
        f.write(updated_content)
        
    print("Successfully replaced content")
else:
    print("Match not found")

