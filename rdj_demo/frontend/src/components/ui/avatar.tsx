import * as React from "react";

import { cn } from "../../lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
}

export function Avatar({ src, alt, className = "", ...props }: AvatarProps) {
  return (
    <div
      className={cn("relative w-10 h-10 rounded-full overflow-hidden", className)}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-gray-700 text-white text-xs uppercase">
          ?
        </div>
      )}
    </div>
  );
}
