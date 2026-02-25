<template>
  <div class="p-4">
    <Tabs default-value="lemmas">
      <TabsList class="bg-muted/50 dark:bg-muted/30">
        <TabsTrigger value="lemmas" class="text-xs sm:text-sm">
          <i class="pi pi-book mr-1.5" />Lemmas ({{ intent.lemmas?.length ?? 0 }})
        </TabsTrigger>
        <TabsTrigger value="phrases" class="text-xs sm:text-sm">
          <i class="pi pi-comments mr-1.5" />Frases ({{ intent.phrases?.length ?? 0 }})
        </TabsTrigger>
        <TabsTrigger value="confirmations" class="text-xs sm:text-sm">
          <i class="pi pi-check-circle mr-1.5" />Confirmaciones ({{ intent.confirmation_patterns?.length ?? 0 }})
        </TabsTrigger>
        <TabsTrigger value="keywords" class="text-xs sm:text-sm">
          <i class="pi pi-key mr-1.5" />Keywords ({{ intent.keywords?.length ?? 0 }})
        </TabsTrigger>
      </TabsList>

      <!-- Lemmas Tab -->
      <TabsContent value="lemmas" class="pt-4">
        <div class="flex gap-2 mb-3">
          <Input
            v-model="newLemma"
            placeholder="Agregar lemma (Enter para guardar)"
            class="flex-1"
            @keyup.enter="onAddLemma"
          />
          <Button size="sm" :disabled="!newLemma" @click="onAddLemma">
            <i class="pi pi-plus" />
          </Button>
        </div>
        <div class="flex flex-wrap gap-2">
          <Badge
            v-for="lemma in (intent.lemmas || [])"
            :key="lemma"
            variant="secondary"
            class="pl-2.5 pr-1 py-1 gap-1.5 text-sm"
          >
            {{ lemma }}
            <button
              class="ml-1 rounded-full p-0.5 hover:bg-foreground/10 transition-colors"
              @click="$emit('removeLemma', intent, lemma)"
            >
              <i class="pi pi-times text-[10px]" />
            </button>
          </Badge>
          <span
            v-if="(intent.lemmas?.length ?? 0) === 0"
            class="text-sm italic text-muted-foreground"
          >
            No hay lemmas configurados
          </span>
        </div>
      </TabsContent>

      <!-- Phrases Tab -->
      <TabsContent value="phrases" class="pt-4">
        <div class="flex gap-2 mb-3">
          <Input
            v-model="newPhrase"
            placeholder="Agregar frase"
            class="flex-1"
          />
          <Select v-model="newPhraseMatchType">
            <SelectTrigger class="w-[130px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="opt in matchTypeOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" :disabled="!newPhrase" @click="onAddPhrase">
            <i class="pi pi-plus" />
          </Button>
        </div>
        <div v-if="(intent.phrases?.length ?? 0) > 0" class="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Frase</TableHead>
                <TableHead class="w-[120px]">Tipo</TableHead>
                <TableHead class="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="phraseData in (intent.phrases || [])" :key="phraseData.phrase">
                <TableCell class="text-sm">{{ phraseData.phrase }}</TableCell>
                <TableCell>
                  <Badge :variant="getMatchTypeBadgeVariant(phraseData.match_type)">
                    {{ getMatchTypeLabel(phraseData.match_type) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 text-red-500 hover:text-red-700 dark:hover:text-red-300"
                    @click="$emit('removePhrase', intent, phraseData.phrase)"
                  >
                    <i class="pi pi-trash text-xs" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <span
          v-else
          class="text-sm italic text-muted-foreground"
        >
          No hay frases configuradas
        </span>
      </TabsContent>

      <!-- Confirmations Tab -->
      <TabsContent value="confirmations" class="pt-4">
        <div class="flex gap-2 mb-3">
          <Input
            v-model="newConfirmation"
            placeholder="Agregar confirmacion"
            class="flex-1"
          />
          <Select v-model="newConfirmationMatchType">
            <SelectTrigger class="w-[130px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="opt in matchTypeOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" :disabled="!newConfirmation" @click="onAddConfirmation">
            <i class="pi pi-plus" />
          </Button>
        </div>
        <div v-if="(intent.confirmation_patterns?.length ?? 0) > 0" class="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Confirmacion</TableHead>
                <TableHead class="w-[120px]">Tipo</TableHead>
                <TableHead class="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="confData in (intent.confirmation_patterns || [])" :key="confData.pattern">
                <TableCell class="text-sm">{{ confData.pattern }}</TableCell>
                <TableCell>
                  <Badge :variant="getMatchTypeBadgeVariant(confData.pattern_type)">
                    {{ getMatchTypeLabel(confData.pattern_type) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="h-7 w-7 text-muted-foreground"
                          disabled
                        >
                          <i class="pi pi-trash text-xs" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Eliminar via edicion de intent</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <span
          v-else
          class="text-sm italic text-muted-foreground"
        >
          No hay confirmaciones configuradas
        </span>
      </TabsContent>

      <!-- Keywords Tab -->
      <TabsContent value="keywords" class="pt-4">
        <div class="flex gap-2 mb-3">
          <Input
            v-model="newKeyword"
            placeholder="Agregar keyword (Enter para guardar)"
            class="flex-1"
            @keyup.enter="onAddKeyword"
          />
          <Button size="sm" :disabled="!newKeyword" @click="onAddKeyword">
            <i class="pi pi-plus" />
          </Button>
        </div>
        <div class="flex flex-wrap gap-2">
          <Badge
            v-for="keyword in (intent.keywords || [])"
            :key="keyword"
            variant="secondary"
            class="pl-2.5 pr-1 py-1 gap-1.5 text-sm"
          >
            {{ keyword }}
            <button
              class="ml-1 rounded-full p-0.5 hover:bg-foreground/10 transition-colors"
              @click="$emit('removeKeyword', intent, keyword)"
            >
              <i class="pi pi-times text-[10px]" />
            </button>
          </Badge>
          <span
            v-if="(intent.keywords?.length ?? 0) === 0"
            class="text-sm italic text-muted-foreground"
          >
            No hay keywords configurados
          </span>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import type { DomainIntent, MatchType } from '@/types/domainIntents.types'
import { MATCH_TYPE_OPTIONS } from '@/types/domainIntents.types'

const props = defineProps<{
  intent: DomainIntent
}>()

const emit = defineEmits<{
  (e: 'addLemma', intent: DomainIntent, value: string): void
  (e: 'removeLemma', intent: DomainIntent, lemma: string): void
  (e: 'addPhrase', intent: DomainIntent, value: string, matchType: MatchType): void
  (e: 'removePhrase', intent: DomainIntent, phrase: string): void
  (e: 'addConfirmation', intent: DomainIntent, value: string, matchType: MatchType): void
  (e: 'addKeyword', intent: DomainIntent, value: string): void
  (e: 'removeKeyword', intent: DomainIntent, keyword: string): void
}>()

// Local input state per expanded row instance
const newLemma = ref('')
const newKeyword = ref('')
const newPhrase = ref('')
const newPhraseMatchType = ref<MatchType>('contains')
const newConfirmation = ref('')
const newConfirmationMatchType = ref<MatchType>('exact')

const matchTypeOptions = MATCH_TYPE_OPTIONS

function onAddLemma() {
  if (!newLemma.value.trim()) return
  emit('addLemma', props.intent, newLemma.value.trim())
  newLemma.value = ''
}

function onAddPhrase() {
  if (!newPhrase.value.trim()) return
  emit('addPhrase', props.intent, newPhrase.value.trim(), newPhraseMatchType.value)
  newPhrase.value = ''
}

function onAddConfirmation() {
  if (!newConfirmation.value.trim()) return
  emit('addConfirmation', props.intent, newConfirmation.value.trim(), newConfirmationMatchType.value)
  newConfirmation.value = ''
}

function onAddKeyword() {
  if (!newKeyword.value.trim()) return
  emit('addKeyword', props.intent, newKeyword.value.trim())
  newKeyword.value = ''
}

function getMatchTypeBadgeVariant(matchType: string | null): 'success' | 'info' | 'warning' | 'secondary' {
  switch (matchType) {
    case 'exact': return 'success'
    case 'contains': return 'info'
    case 'prefix': return 'warning'
    default: return 'secondary'
  }
}

function getMatchTypeLabel(matchType: string | null): string {
  const option = matchTypeOptions.find(o => o.value === matchType)
  return option?.label || matchType || 'N/A'
}
</script>
