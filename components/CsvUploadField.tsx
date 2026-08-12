"use client";

import type { DragEvent } from "react";
import { useRef, useState } from "react";
import { CheckCircle2, FileSpreadsheet, UploadCloud } from "lucide-react";

export default function CsvUploadField({ name = "file", required = false }: { name?: string; required?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  function selectFile(nextFile?: File) {
    if (!nextFile) return;
    const valid = nextFile.name.toLowerCase().endsWith(".csv") || nextFile.type === "text/csv";
    if (!valid) {
      setFile(null);
      setError("Escolhe um ficheiro CSV.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setError("");
    setFile(nextFile);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const nextFile = event.dataTransfer.files[0];
    if (!nextFile || !inputRef.current) return;
    const transfer = new DataTransfer();
    transfer.items.add(nextFile);
    inputRef.current.files = transfer.files;
    selectFile(nextFile);
  }

  return (
    <div>
      <label
        className={`relative flex min-h-36 cursor-pointer items-center justify-center overflow-hidden rounded-[24px] border-2 border-dashed px-5 py-7 text-center transition ${dragging ? "border-[#9B6F3B] bg-[#FFF0D6] shadow-[0_18px_45px_rgba(130,87,36,0.15)]" : file ? "border-[#9FC8A3] bg-[#F1FAF1]" : "border-[#D6C3A5] bg-[#FFF9F0] hover:border-[#C8A56A] hover:bg-[#FFFDF8]"}`}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }}
        onDrop={onDrop}
      >
        <input ref={inputRef} name={name} type="file" accept=".csv,text/csv" required={required} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={(event) => selectFile(event.target.files?.[0])} />
        {dragging ? <div><UploadCloud size={30} className="mx-auto text-[#9B6F3B]" /><p className="mt-2 text-sm font-black text-[#704E27]">Larga o CSV aqui</p><p className="mt-1 text-xs text-[#8A7863]">Fica imediatamente pronto a importar</p></div> : file ? <div><CheckCircle2 size={30} className="mx-auto text-[#4F7A59]" /><p className="mt-2 max-w-sm truncate text-sm font-black text-[#315B3C]">{file.name}</p><p className="mt-1 text-xs font-semibold text-[#567461]">Pronto · {(file.size / 1024).toFixed(0)} KB · clica ou arrasta outro para substituir</p></div> : <div><FileSpreadsheet size={30} className="mx-auto text-[#A97936]" /><p className="mt-2 text-sm font-black text-[#4F3923]">Arrasta o CSV diretamente para aqui</p><p className="mt-1 text-xs text-[#8A7863]">Ou toca em qualquer parte desta caixa para procurar</p></div>}
      </label>
      {error && <p className="mt-2 rounded-xl bg-[#FFF0EA] px-3 py-2 text-xs font-semibold text-[#A14E36]">{error}</p>}
    </div>
  );
}
