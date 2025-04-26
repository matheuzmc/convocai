"use client";

import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  aspectRatio: number;
  circularCrop?: boolean;
  compressionOptions: {
    maxSizeMB: number;
    maxWidthOrHeight: number;
    useWebWorker?: boolean;
    fileType?: string;
    initialQuality?: number;
  };
  onConfirm: (croppedFile: File) => void;
}

// Função auxiliar para converter canvas em Blob (pode ser movida para utils se usada em mais lugares)
const canvasToBlob = (canvas: HTMLCanvasElement, type = 'image/png', quality = 0.8): Promise<Blob | null> => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
};

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  aspectRatio,
  circularCrop = false,
  compressionOptions,
  onConfirm,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessingCrop, setIsProcessingCrop] = useState(false);

  // Reseta o crop quando a imagem ou a flag de abertura mudam
  useEffect(() => {
    if (isOpen && imageSrc) {
      setCrop(undefined);
      setCompletedCrop(undefined);
      // A centralização ocorrerá no onLoad da imagem
    }
  }, [isOpen, imageSrc]);

  // Função para centralizar o crop inicial
  function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number
  ) {
    return centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90, // Começa com 90% da largura/altura
        },
        aspect,
        mediaWidth,
        mediaHeight
      ),
      mediaWidth,
      mediaHeight
    );
  }

  // Chamado quando a imagem dentro do ReactCrop carrega
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    // Define o crop inicial centralizado com a proporção correta
    setCrop(centerAspectCrop(width, height, aspectRatio));
  }

  const handleCropConfirm = async () => {
    const image = imgRef.current;
    const canvas = previewCanvasRef.current;

    if (!image || !canvas || !completedCrop || !completedCrop.width || !completedCrop.height) {
      toast.error("Erro: Não foi possível finalizar o corte. Verifique a imagem e a seleção.");
      return;
    }

    setIsProcessingCrop(true);

    try {
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const pixelRatio = window.devicePixelRatio || 1;

      canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);
      canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Não foi possível obter o contexto 2D do canvas.");
      }

      ctx.scale(pixelRatio, pixelRatio);
      ctx.imageSmoothingQuality = 'high';

      const cropX = completedCrop.x * scaleX;
      const cropY = completedCrop.y * scaleY;
      const cropWidth = completedCrop.width * scaleX;
      const cropHeight = completedCrop.height * scaleY;
      
      // Desenha a imagem cortada no canvas
      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      // 1. Obter o blob inicial do canvas
      const initialBlob = await canvasToBlob(canvas, 'image/png', 0.92); // Qualidade alta antes de comprimir
      if (!initialBlob) {
        throw new Error('Falha ao criar blob inicial da imagem cortada.');
      }
      console.log(`Blob inicial (pré-compressão) size: ${(initialBlob.size / 1024).toFixed(2)} KB`);

      // 2. Comprimir o blob
      // Usa as opções passadas via props
      const finalCompressionOptions = {
        useWebWorker: true, // Default useWebWorker to true
        ...compressionOptions,
      };
      const compressedBlob = await imageCompression(new File([initialBlob], "initial.png", {type: 'image/png'}), finalCompressionOptions);
      const outputType = finalCompressionOptions.fileType || compressedBlob.type || 'image/webp'; // Default to webp if not specified
      const outputFileName = `cropped.${outputType.split('/')[1] || 'webp'}`;
      console.log(`Blob comprimido (${outputType}) size: ${(compressedBlob.size / 1024).toFixed(2)} KB`);

      // 3. Criar o File final e chamar o callback onConfirm
      const croppedFile = new File([compressedBlob], outputFileName, { type: outputType });
      onConfirm(croppedFile); // Chama o callback com o arquivo final
      onClose(); // Fecha o modal após sucesso

    } catch (error) {
      console.error("Erro ao gerar imagem cortada:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao cortar imagem";
      toast.error(`Erro ao processar imagem: ${errorMessage}`);
    } finally {
      setIsProcessingCrop(false);
    }
  };

  const handleCropCancel = () => {
    onClose(); // Simplesmente fecha o modal
  };

  // Não renderiza nada se não estiver aberto
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajustar Imagem</DialogTitle>
        </DialogHeader>
        {imageSrc ? (
          <div className="flex justify-center items-center mt-4">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              circularCrop={circularCrop}
              // minWidth={100} // Pode ser parametrizado via props se necessário
              // minHeight={100}
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imageSrc}
                style={{ display: 'block', maxHeight: '70vh', width: 'auto' }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </div>
        ) : (
          <div className="text-center p-8">Carregando imagem...</div>
        )}
        {/* Canvas oculto */}
        <canvas
          ref={previewCanvasRef}
          style={{
            display: 'none',
            objectFit: 'contain',
            width: completedCrop?.width ?? 0,
            height: completedCrop?.height ?? 0,
          }}
        />
        <DialogFooter className="mt-4">
           <Button variant="outline" onClick={handleCropCancel} disabled={isProcessingCrop}>Cancelar</Button>
           <Button onClick={handleCropConfirm} disabled={!completedCrop || !completedCrop.width || isProcessingCrop}>
              {isProcessingCrop && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isProcessingCrop ? 'Processando...' : 'Confirmar'}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 