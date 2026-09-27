import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PhotoUpload({ formData, setFormData }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData((prev) => ({ ...prev, photo_url: file_url }));
    setUploading(false);
  };

  const removePhoto = () => {
    setFormData((prev) => ({ ...prev, photo_url: "" }));
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="bg-[#1e3a5f] text-white rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera size={20} />
          Foto Siswa
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-4">
          {formData.photo_url ? (
            <div className="relative">
              <img
                src={formData.photo_url}
                alt="Foto Siswa"
                className="w-40 h-48 object-cover rounded-xl shadow-md"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 rounded-full w-8 h-8"
                onClick={removePhoto}
              >
                <X size={16} />
              </Button>
            </div>
          ) : (
            <div className="w-40 h-48 bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300">
              <Camera size={48} className="text-slate-400" />
            </div>
          )}

          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
            <Button
              variant="outline"
              className="gap-2"
              disabled={uploading}
              asChild
            >
              <span>
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Mengupload...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    {formData.photo_url ? "Ganti Foto" : "Upload Foto"}
                  </>
                )}
              </span>
            </Button>
          </label>

          <p className="text-xs text-slate-500 text-center">
            Format: JPG, PNG. Ukuran: 3x4 cm<br />
            Maksimal 2MB
          </p>
        </div>
      </CardContent>
    </Card>
  );
}