export default function Header() {
  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-blue-950">
          Dashboard Monitoring Akreditasi & SPMI
        </h1>
        <p className="text-sm text-slate-500">
          Politeknik Sinar Mas Berau Coal
        </p>
      </div>

      <div className="text-right">
        <p className="text-sm font-semibold text-blue-950">Admin UPMI</p>
        <p className="text-xs text-slate-500">Administrator</p>
      </div>
    </header>
  );
}