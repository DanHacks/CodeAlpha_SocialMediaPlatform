import { useState } from "react";
import { Button } from "@/components/ui/button";
import { mockFiles, SharedFile, currentUser } from "@/lib/mockData";
import { FileText, Download, Upload, Image as ImageIcon, FileArchive } from "lucide-react";
import { toast } from "sonner";

const iconFor = (type: string) => {
  if (type === "pdf" || type === "doc") return FileText;
  if (type === "img") return ImageIcon;
  return FileArchive;
};

export function FilesPanel() {
  const [files, setFiles] = useState<SharedFile[]>(mockFiles);

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newFile: SharedFile = {
      id: `f-${Date.now()}`,
      name: file.name,
      size: `${(file.size / 1024).toFixed(0)} KB`,
      uploadedBy: currentUser.name,
      uploadedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: file.name.split(".").pop() || "file",
    };
    setFiles((prev) => [newFile, ...prev]);
    toast.success(`${file.name} shared with the room`);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <label className="block">
          <input type="file" className="hidden" onChange={onUpload} />
          <div className="border-2 border-dashed border-primary/30 rounded-xl p-5 text-center cursor-pointer hover:bg-primary/5 transition">
            <Upload className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-sm font-medium">Drop a file or click to share</div>
            <div className="text-xs text-muted-foreground mt-1">Up to 100MB · everyone in the room can download</div>
          </div>
        </label>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {files.map((f) => {
          const Icon = iconFor(f.type);
          return (
            <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition border">
              <div className="h-10 w-10 rounded-lg bg-brand-gradient flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{f.name}</div>
                <div className="text-xs text-muted-foreground">{f.size} · {f.uploadedBy} · {f.uploadedAt}</div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => toast.success("Download started")}><Download className="h-4 w-4" /></Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
