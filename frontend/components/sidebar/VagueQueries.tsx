'use client';

import { SearchToggle } from './SearchToggle';
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '@/components/ui/sidebar';
import { Slider } from '@/components/ui/slider';
import { HELP_TEXTS } from '@/lib/help-texts';

interface VagueQueriesProps {
  options: {
    queryExpansion?: {
      enabled: boolean;
      temperature: number;
    };
  };
  onOptionsUpdate: (options: any) => void;
}

export function VagueQueries({ options, onOptionsUpdate }: VagueQueriesProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-0">Vague Queries</SidebarGroupLabel>
      <SidebarGroupContent className="space-y-3">
        <div className="px-2">
          <SearchToggle
            id="query-expansion"
            label="Query Expansion"
            helpText={HELP_TEXTS.QUERY_EXPANSION}
            checked={options.queryExpansion?.enabled ?? false}
            onCheckedChange={(enabled) =>
              onOptionsUpdate({
                queryExpansion: enabled
                  ? {
                      enabled: true,
                      temperature: options.queryExpansion?.temperature ?? 0.5,
                    }
                  : undefined,
              })
            }
          />
        </div>

        {options.queryExpansion?.enabled && (
          <div className="px-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Temperature</span>
              <span className="text-xs text-muted-foreground">
                {(() => {
                  const t = options.queryExpansion.temperature;
                  if (t <= 0.3) return 'Conservative';
                  if (t <= 0.5) return 'Moderate';
                  if (t <= 0.7) return 'Aggressive';
                  return '🔥';
                })()}
              </span>
            </div>
            <Slider
              className="hover:cursor-pointer"
              min={0}
              max={1}
              step={0.01}
              value={[options.queryExpansion.temperature]}
              onValueChange={([v]) =>
                onOptionsUpdate({
                  queryExpansion: {
                    enabled: true,
                    temperature: Number(v.toFixed(2)),
                  },
                })
              }
            />
            <div className="text-xs text-muted-foreground text-right">
              {(options.queryExpansion?.temperature ?? 0.5).toFixed(2)}
            </div>
          </div>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
