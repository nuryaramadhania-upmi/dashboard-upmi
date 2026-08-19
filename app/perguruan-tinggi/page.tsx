import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { allDocuments, completionPercent, PT_NAME } from "@/data/documentData";

export default function PerguruanTinggiPage() {
  const led = allDocuments.filter((d) => d.instrumen === "LED PT");
  const lkpt = allDocuments.filter((d) => d.instrumen === "LKPT");
  return <AppLayout><div className="space-y-6"><div><h1 className="text-2xl font-bold text-blue-950">Perguruan Tinggi</h1><p className="text-slate-500">Monitoring instrumen tingkat institusi — {PT_NAME}.</p></div><div className="grid gap-5 md:grid-cols-2">{[{name:"LED PT",docs:led},{name:"LKPT",docs:lkpt}].map((item)=><Link key={item.name} href={`/monitoring?prodi=${encodeURIComponent(PT_NAME)}`} className="rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"><p className="text-sm text-slate-500">Instrumen Perguruan Tinggi</p><h2 className="mt-1 text-xl font-bold text-blue-950">{item.name}</h2><p className="mt-5 text-3xl font-bold text-blue-950">{completionPercent(item.docs)}%</p><p className="text-sm text-slate-500">{item.docs.length} komponen dokumen</p><div className="mt-4 h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-blue-950" style={{width:`${completionPercent(item.docs)}%`}}/></div></Link>)}</div></div></AppLayout>;
}
