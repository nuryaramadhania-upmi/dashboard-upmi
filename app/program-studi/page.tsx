"use client";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { prodiSummary } from "@/data/masterData";

export default function ProgramStudiPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#071952]">Program Studi</h1>
          <p className="text-slate-500">
            Monitoring kesiapan dokumen akreditasi setiap program studi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {prodiSummary.map((prodi) => (
            <Link
              key={prodi.id}
              href={`/monitoring?prodi=${encodeURIComponent(prodi.nama)}`}
              className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 block hover:shadow-md hover:-translate-y-1 transition"
            >
              <p className="text-sm text-slate-500">{prodi.jenjang}</p>

              <h2 className="text-xl font-bold text-[#071952] mt-1">
                {prodi.nama}
              </h2>

              <div className="mt-5">
                <p className="text-sm text-slate-500">Kesiapan Dokumen</p>
                <p className="text-3xl font-bold text-[#071952]">
                  {prodi.kesiapan}%
                </p>

                <div className="w-full bg-slate-100 rounded-full h-3 mt-3">
                  <div
                    className="bg-[#17245A] h-3 rounded-full"
                    style={{ width: `${prodi.kesiapan}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-6">
                <div>
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="font-bold text-[#071952]">
                    {prodi.totalDokumen}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Lengkap</p>
                  <p className="font-bold text-green-600">
                    {prodi.dokumenLengkap}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Kurang</p>
                  <p className="font-bold text-red-600">
                    {prodi.dokumenKurang}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-sm text-[#071952]">
                  {prodi.status}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-[#071952] mb-4">
            Rekap Program Studi
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-3">Program Studi</th>
                  <th className="py-3">Jenjang</th>
                  <th className="py-3">Total Dokumen</th>
                  <th className="py-3">Lengkap</th>
                  <th className="py-3">Kurang</th>
                  <th className="py-3">Kesiapan</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {prodiSummary.map((prodi) => (
                  <tr key={prodi.id} className="border-b">
                    <td className="py-4 font-medium text-[#071952]">
                      {prodi.nama}
                    </td>
                    <td className="py-4">{prodi.jenjang}</td>
                    <td className="py-4">{prodi.totalDokumen}</td>
                    <td className="py-4 text-green-600 font-medium">
                      {prodi.dokumenLengkap}
                    </td>
                    <td className="py-4 text-red-600 font-medium">
                      {prodi.dokumenKurang}
                    </td>
                    <td className="py-4 font-bold">{prodi.kesiapan}%</td>
                    <td className="py-4">{prodi.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}