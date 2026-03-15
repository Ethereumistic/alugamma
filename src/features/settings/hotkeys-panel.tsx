import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

function HotkeyRow({ shortcut, action }: { shortcut: React.ReactNode; action: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <span className="text-muted-foreground/80">{action}</span>
      <div className="flex items-center gap-1.5">
        {shortcut}
      </div>
    </div>
  );
}

export function HotkeysPanel() {
  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-6">
        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-emerald-400/90">Traditional</h3>
          <div className="space-y-1">
            <HotkeyRow
              shortcut={<KbdGroup><Kbd>⌘/Ctrl</Kbd><Kbd>S</Kbd></KbdGroup>}
              action="Save design"
            />
            <HotkeyRow
              shortcut={<KbdGroup><Kbd>⌘/Ctrl</Kbd><Kbd>S</Kbd> <Kbd>→</Kbd> <Kbd>D</Kbd></KbdGroup>}
              action="Save + Duplicate"
            />
            <HotkeyRow
              shortcut={<KbdGroup><Kbd>⌘/Ctrl</Kbd><Kbd>S</Kbd> <Kbd>→</Kbd> <Kbd>E</Kbd></KbdGroup>}
              action="Save + Export DXF"
            />
            <HotkeyRow
              shortcut={<KbdGroup><Kbd>⌘/Ctrl</Kbd><Kbd>N</Kbd></KbdGroup>}
              action="New design"
            />
            <HotkeyRow
              shortcut={<KbdGroup><Kbd>⌘/Ctrl</Kbd><Kbd>Delete</Kbd></KbdGroup>}
              action="Delete design (confirm)"
            />
            <HotkeyRow
              shortcut={<KbdGroup><Kbd>⌘/Ctrl</Kbd><Kbd>Shift</Kbd><Kbd>Delete</Kbd></KbdGroup>}
              action="Delete design (no confirm)"
            />
            <HotkeyRow
              shortcut={<KbdGroup><Kbd>⌘/Ctrl</Kbd><Kbd>F</Kbd></KbdGroup>}
              action="Center/focus preview"
            />
            <HotkeyRow
              shortcut={<KbdGroup><Kbd>⌘/Ctrl</Kbd><Kbd>R</Kbd></KbdGroup>}
              action="Toggle rubberband"
            />
          </div>
        </div>

        <Separator className="bg-white/10" />

        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-fuchsia-400/90">Power User (Sheet Metal)</h3>
          <p className="mb-3 text-xs text-muted-foreground/60">
            Side selection hotkeys only work when not typing in an input field.
          </p>
          <div className="space-y-1">
            <HotkeyRow shortcut={<Kbd>W</Kbd>} action="Select Top side" />
            <HotkeyRow shortcut={<Kbd>A</Kbd>} action="Select Left side" />
            <HotkeyRow shortcut={<Kbd>S</Kbd>} action="Select Bottom side" />
            <HotkeyRow shortcut={<Kbd>D</Kbd>} action="Select Right side" />
            <HotkeyRow shortcut={<Kbd>F</Kbd>} action="Add Flange (side selected)" />
            <HotkeyRow shortcut={<Kbd>Z</Kbd>} action="Add Frez (side selected)" />
            <HotkeyRow shortcut={<Kbd>Q</Kbd>} action="Toggle L checkbox (side selected)" />
            <HotkeyRow shortcut={<Kbd>E</Kbd>} action="Toggle R checkbox (side selected)" />
            <HotkeyRow shortcut={<Kbd>Esc</Kbd>} action="Deselect side" />
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
