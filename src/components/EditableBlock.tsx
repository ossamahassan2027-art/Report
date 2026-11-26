import React from 'react';
import {
  BlockStyleOverride,
  EditTargetDescriptor,
  getBlockInlineStyle,
} from '../types/clickEdit';

interface EditableBlockProps {
  target: EditTargetDescriptor;
  override?: BlockStyleOverride;
  editable?: boolean;
  onSelect?: (target: EditTargetDescriptor) => void;
  className?: string;
  style?: React.CSSProperties;
  as?: 'div' | 'span' | 'section' | 'p' | 'h1' | 'h2' | 'h3';
  children: React.ReactNode;
}

export const EditableBlock: React.FC<EditableBlockProps> = ({
  target,
  override,
  editable = false,
  onSelect,
  className = '',
  style,
  as = 'div',
  children,
}) => {
  if (override?.hidden) {
    return null;
  }

  const mergedStyle: React.CSSProperties = {
    ...style,
    ...getBlockInlineStyle(override),
  };

  const canClick = Boolean(editable && onSelect);

  const handleClick = (e: React.MouseEvent) => {
    if (!canClick || !onSelect) return;
    e.stopPropagation();
    onSelect(target);
  };

  const combinedClass = canClick
    ? `click-edit-target ${className}`
    : className;

  const Tag = as;

  return (
    <Tag
      onClick={canClick ? handleClick : undefined}
      data-edit-label={canClick ? `اضغط للتعديل: ${target.label}` : undefined}
      title={canClick ? `اضغط للتعديل: ${target.label}` : undefined}
      className={combinedClass}
      style={mergedStyle}
    >
      {children}
    </Tag>
  );
};
