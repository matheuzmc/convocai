"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ImageCropModal } from '@/components/features/ImageCropModal';
import { GROUP_IMAGE_COMPRESSION_OPTIONS } from '@/lib/constants';

// Tipagem correta para as opções de compressão
type CompressionOptions = typeof GROUP_IMAGE_COMPRESSION_OPTIONS;

interface UseImageUploadProps {
  initialImageUrl?: string | null;
  aspectRatio?: number;
  compressionOptions?: CompressionOptions; // Usa o tipo definido acima
  circularCrop?: boolean;
}

// Definição correta da Interface de Retorno
interface UseImageUploadReturn {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  triggerFileInput: () => void;
  displayImageUrl: string | null;
  isProcessing: boolean;
  selectedFile: File | null;
  renderCropModal: () => React.ReactNode;
  clearSelection: () => void;
  onSelectFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function useImageUpload({
  initialImageUrl = null,
  aspectRatio = 16 / 9,
  compressionOptions = GROUP_IMAGE_COMPRESSION_OPTIONS,
  circularCrop = false,
}: UseImageUploadProps): UseImageUploadReturn {
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [cropModalImageSrc, setCropModalImageSrc] = useState<string>('');
  const [showCropModal, setShowCropModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const latestPreviewUrlRef = useRef<string | null>(null); // Ref para guardar a URL atual

  // Atualiza a ref sempre que imagePreviewUrl mudar
  useEffect(() => {
    latestPreviewUrlRef.current = imagePreviewUrl;
  }); // Sem array de dependência, roda a cada render

  // useEffect para limpar a ÚLTIMA URL no desmonte do componente
  useEffect(() => {
    // A função retornada só executa quando o componente desmonta
    return () => {
      if (latestPreviewUrlRef.current) {
        URL.revokeObjectURL(latestPreviewUrlRef.current);
        latestPreviewUrlRef.current = null; // Limpa a ref
      }
    };
  }, []); // Array vazio garante que rode só no mount/unmount

  // Callback para limpar seleção
  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsProcessing(false);
  }, [imagePreviewUrl]);

  // Limpa seleção se imagem inicial mudar
  useEffect(() => {
    // Não precisa chamar clearSelection diretamente aqui, 
    // A mudança na initialImageUrl fará com que displayImageUrl recalcule.
    // A lógica de revogar a preview anterior foi movida para handleCropComplete.
    // Apenas resetamos o estado do arquivo final selecionado.
    setSelectedFile(null);
    // Não limpamos imagePreviewUrl aqui, pois pode ser a preview recém criada.
  }, [initialImageUrl]); // Depende APENAS de initialImageUrl

  // Handler para seleção de arquivo
  const onSelectFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setIsProcessing(true);
    const file = event.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error("Formato de imagem inválido. Use JPG, PNG ou WEBP.");
        if (event.target) event.target.value = "";
        setIsProcessing(false);
        return;
      }
      clearSelection();
      try {
        const newImgSrc = URL.createObjectURL(file);
        setCropModalImageSrc(newImgSrc);
        setShowCropModal(true);
      } catch {
         toast.error("Não foi possível carregar a imagem para corte.");
         clearSelection();
      } 
      if (event.target) event.target.value = "";
    } else {
      setIsProcessing(false);
    }
  }, [clearSelection]);

  // Função para acionar o input
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handler para quando o corte é completado
  const handleCropComplete = useCallback((croppedFile: File) => {
    setSelectedFile(croppedFile);
    
    const oldPreviewUrl = imagePreviewUrl; // Guarda a URL antiga para revogar depois
    let newPreviewUrl = '';
    try {
      newPreviewUrl = URL.createObjectURL(croppedFile);
    } catch (e) {
      console.error("[useImageUpload] handleCropComplete: Failed to create new preview URL", e);
      toast.error("Erro ao gerar prévia da imagem cortada.");
      if (cropModalImageSrc) {
        URL.revokeObjectURL(cropModalImageSrc);
        setCropModalImageSrc('');
      }
      setShowCropModal(false);
      setIsProcessing(false);
      return;
    }

    // Revoga a URL *anterior* de preview (se existia)
    if (oldPreviewUrl) {
      URL.revokeObjectURL(oldPreviewUrl);
    }

    // Define a nova URL de preview
    setImagePreviewUrl(newPreviewUrl);

    // Limpa e fecha o modal
    if (cropModalImageSrc) {
      URL.revokeObjectURL(cropModalImageSrc);
      setCropModalImageSrc('');
    }
    setShowCropModal(false);
    setIsProcessing(false);
  }, [imagePreviewUrl, cropModalImageSrc]);

  // Handler para fechamento do modal
  const handleCropModalClose = useCallback(() => {
    if (cropModalImageSrc) {
      URL.revokeObjectURL(cropModalImageSrc);
      setCropModalImageSrc('');
    }
    setShowCropModal(false);
    setIsProcessing(false);
  }, [cropModalImageSrc]);

  // Função que renderiza o modal
  const renderCropModal = useCallback((): React.ReactNode => {
    if (!showCropModal || !cropModalImageSrc) {
      return null;
    }
    return React.createElement(ImageCropModal, {
      isOpen: showCropModal,
      onClose: handleCropModalClose,
      imageSrc: cropModalImageSrc,
      aspectRatio: aspectRatio,
      circularCrop: circularCrop,
      compressionOptions: compressionOptions,
      onConfirm: handleCropComplete,
    });
  }, [showCropModal, cropModalImageSrc, handleCropModalClose, aspectRatio, circularCrop, compressionOptions, handleCropComplete]);

  // URL a ser exibida (preview ou inicial)
  const displayImageUrl = imagePreviewUrl || initialImageUrl || null;

  // Retorno do Hook
  return {
    fileInputRef,
    triggerFileInput,
    displayImageUrl,
    isProcessing,
    selectedFile,
    renderCropModal,
    clearSelection,
    onSelectFile,
  };
} 