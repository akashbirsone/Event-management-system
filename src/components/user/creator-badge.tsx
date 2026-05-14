
import React from 'react';
import { Instagram } from 'lucide-react';

export function CreatorBadge() {
  return (
    <a
      href="https://instagram.com/jay_kamble_009"
      target="_blank"
      rel="noopener noreferrer"
      className="creator-badge group"
    >
      <Instagram className="creator-badge-icon h-4 w-4 transition-transform group-hover:scale-110" />
      <span className="creator-badge-text">
        Created by Akash Birsone
      </span>
    </a>
  );
}
