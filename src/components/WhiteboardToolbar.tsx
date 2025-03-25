
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import {
  Hand,
  Pen,
  Text,
  Shapes,
  Eraser,
  Undo,
  Redo,
  Trash,
  Save,
  AlignJustify
} from "lucide-react";
import { Button } from './ui/button';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";

interface WhiteboardToolbarProps {
  onToolChange: (tool: string) => void;
  onColorChange: (color: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
}

const COLORS = [
  "#000000", // Black
  "#6B7280", // Gray
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#22C55E", // Green
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Purple
];

const WhiteboardToolbar = ({ 
  onToolChange, 
  onColorChange,
  onUndo,
  onRedo,
  onClear,
  onSave
}: WhiteboardToolbarProps) => {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col">
      {/* Color picker */}
      <div className="p-2 flex justify-center border-b border-gray-200">
        <div className="grid grid-cols-10 gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              className="w-6 h-6 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              style={{ backgroundColor: color }}
              onClick={() => onColorChange(color)}
            />
          ))}
        </div>
      </div>
      
      {/* Main tools */}
      <div className="grid grid-cols-6 divide-x">
        <Button 
          variant="ghost" 
          className="flex flex-col items-center p-4 h-auto rounded-none" 
          onClick={() => onToolChange("select")}
        >
          <Hand className="h-6 w-6 mb-1" />
          <span className="text-xs">选择</span>
        </Button>
        
        <Button 
          variant="ghost" 
          className="flex flex-col items-center p-4 h-auto rounded-none" 
          onClick={() => onToolChange("hand")}
        >
          <Hand className="h-6 w-6 mb-1" />
          <span className="text-xs">抓手</span>
        </Button>
        
        <Button 
          variant="ghost" 
          className="flex flex-col items-center p-4 h-auto rounded-none" 
          onClick={() => onToolChange("pen")}
        >
          <Pen className="h-6 w-6 mb-1" />
          <span className="text-xs">画笔</span>
        </Button>
        
        <Button 
          variant="ghost" 
          className="flex flex-col items-center p-4 h-auto rounded-none" 
          onClick={() => onToolChange("text")}
        >
          <Text className="h-6 w-6 mb-1" />
          <span className="text-xs">文本</span>
        </Button>
        
        <Button 
          variant="ghost" 
          className="flex flex-col items-center p-4 h-auto rounded-none" 
          onClick={() => onToolChange("shapes")}
        >
          <Shapes className="h-6 w-6 mb-1" />
          <span className="text-xs">图形</span>
        </Button>
        
        <Button 
          variant="ghost" 
          className="flex flex-col items-center p-4 h-auto rounded-none" 
          onClick={() => onToolChange("eraser")}
        >
          <Eraser className="h-6 w-6 mb-1" />
          <span className="text-xs">橡皮擦</span>
        </Button>
      </div>
      
      {/* Utilities */}
      <div className="grid grid-cols-6 divide-x border-t border-gray-200">
        <Button 
          variant="ghost" 
          className="flex flex-col items-center p-4 h-auto rounded-none" 
          onClick={onUndo}
        >
          <Undo className="h-6 w-6 mb-1" />
          <span className="text-xs">撤销</span>
        </Button>
        
        <Button 
          variant="ghost" 
          className="flex flex-col items-center p-4 h-auto rounded-none" 
          onClick={onRedo}
        >
          <Redo className="h-6 w-6 mb-1" />
          <span className="text-xs">重做</span>
        </Button>
        
        <Button 
          variant="ghost" 
          className="flex flex-col items-center p-4 h-auto rounded-none"
        >
          <AlignJustify className="h-6 w-6 mb-1" />
          <span className="text-xs">批注设置</span>
        </Button>
        
        <Button 
          variant="ghost" 
          className="flex flex-col items-center p-4 h-auto rounded-none" 
          onClick={onClear}
        >
          <Trash className="h-6 w-6 mb-1" />
          <span className="text-xs">清空</span>
        </Button>
        
        <Button 
          variant="ghost" 
          className="flex flex-col items-center p-4 h-auto rounded-none" 
          onClick={onSave}
        >
          <Save className="h-6 w-6 mb-1" />
          <span className="text-xs">保存</span>
        </Button>
        
        <Button 
          variant="ghost" 
          className="flex flex-col items-center p-4 h-auto rounded-none"
        >
          <AlignJustify className="h-6 w-6 mb-1" />
          <span className="text-xs">收起</span>
        </Button>
      </div>
    </div>
  );
};

export default WhiteboardToolbar;
