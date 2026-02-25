<template>
  <div class="p-6 space-y-6">
    <!-- Header with Domain Selector -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-semibold text-foreground">
          <Tags class="h-6 w-6" />
          Gestion de Intents
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">Configura intents y patrones por dominio</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <!-- Domain Selector -->
        <Select :model-value="selectedDomain ?? undefined" @update:model-value="(v: string) => selectedDomain = v as any">
          <SelectTrigger class="min-w-[200px]">
            <SelectValue :placeholder="'Seleccionar Dominio'">
              <span v-if="selectedDomain" class="flex items-center gap-2">
                <i :class="getDomainIcon(selectedDomain)" :style="{ color: getDomainColor(selectedDomain) }"></i>
                {{ getDomainName(selectedDomain) }}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="domain in availableDomains"
              :key="domain.key"
              :value="domain.key"
            >
              <span class="flex items-center gap-2">
                <i :class="domain.icon" :style="{ color: domain.color }"></i>
                {{ domain.name }}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        <Button class="gap-2" @click="openCreateDialog" :disabled="!selectedDomain">
          <Plus class="h-4 w-4" />
          Nuevo Intent
        </Button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="outline" class="gap-2" @click="openSeedDialog" :disabled="!selectedDomain">
                <Database class="h-4 w-4" />
                Seed
              </Button>
            </TooltipTrigger>
            <TooltipContent>Cargar intents por defecto</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="outline" class="gap-2" @click="exportIntents" :disabled="!selectedDomain || intents.length === 0">
                <Download class="h-4 w-4" />
                Exportar
              </Button>
            </TooltipTrigger>
            <TooltipContent>Exportar intents a JSON</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="outline" class="gap-2" @click="openImportDialog" :disabled="!selectedDomain">
                <Upload class="h-4 w-4" />
                Importar
              </Button>
            </TooltipTrigger>
            <TooltipContent>Importar intents desde JSON</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon" @click="fetchCacheStats" :disabled="loadingCacheStats">
                <BarChart3 class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Estadisticas del cache</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon" @click="invalidateCache" :disabled="!selectedDomain">
                <RefreshCw class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Invalidar cache</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>

    <!-- Domain Stats Cards -->
    <div v-if="selectedDomain" class="flex flex-wrap gap-4">
      <div class="glass-card flex items-center gap-4 px-6 py-4 min-w-[150px]">
        <List class="h-6 w-6 text-primary" />
        <div class="flex flex-col">
          <span class="text-2xl font-semibold text-foreground">{{ intents.length }}</span>
          <span class="text-sm text-muted-foreground">Intents</span>
        </div>
      </div>
      <div class="glass-card flex items-center gap-4 px-6 py-4 min-w-[150px]">
        <CheckCircle class="h-6 w-6 text-primary" />
        <div class="flex flex-col">
          <span class="text-2xl font-semibold text-foreground">{{ enabledIntents }}</span>
          <span class="text-sm text-muted-foreground">Activos</span>
        </div>
      </div>
      <div class="glass-card flex items-center gap-4 px-6 py-4 min-w-[150px]">
        <Tags class="h-6 w-6 text-primary" />
        <div class="flex flex-col">
          <span class="text-2xl font-semibold text-foreground">{{ totalPatterns }}</span>
          <span class="text-sm text-muted-foreground">Patrones</span>
        </div>
      </div>
    </div>

    <!-- No Domain Selected -->
    <div v-if="!selectedDomain" class="glass-card flex flex-col items-center justify-center py-16 px-8 text-center">
      <Inbox class="h-12 w-12 text-muted-foreground mb-4" />
      <h3 class="text-lg font-semibold text-foreground mb-2">Selecciona un Dominio</h3>
      <p class="text-muted-foreground">Elige un dominio del selector para ver y gestionar sus intents</p>
    </div>

    <!-- Intents Table -->
    <div v-else class="space-y-4">
      <!-- Table Header / Search -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="Buscar intents..."
            class="pl-10 w-[280px]"
            @input="onSearch"
          />
        </div>
        <div class="flex items-center gap-2">
          <Switch
            :checked="showOnlyEnabled"
            @update:checked="(v: boolean) => showOnlyEnabled = v"
          />
          <label class="text-sm text-foreground">Solo activos</label>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <RefreshCw class="h-6 w-6 animate-spin text-muted-foreground" />
        <span class="ml-2 text-muted-foreground">Cargando intents...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="intents.length === 0" class="flex flex-col items-center py-12 text-center">
        <Inbox class="h-10 w-10 text-muted-foreground mb-4" />
        <p class="text-muted-foreground mb-4">No hay intents configurados para este dominio</p>
        <Button class="gap-2" @click="openCreateDialog">
          <Plus class="h-4 w-4" />
          Crear primer intent
        </Button>
      </div>

      <!-- Data Table -->
      <div v-else>
        <div class="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[3rem]"></TableHead>
                <TableHead class="min-w-[150px] cursor-pointer select-none" @click="toggleSort('intent_key')">
                  <span class="flex items-center gap-1">
                    Key
                    <component :is="getSortIcon('intent_key')" class="h-3 w-3" />
                  </span>
                </TableHead>
                <TableHead class="min-w-[200px] cursor-pointer select-none" @click="toggleSort('name')">
                  <span class="flex items-center gap-1">
                    Nombre
                    <component :is="getSortIcon('name')" class="h-3 w-3" />
                  </span>
                </TableHead>
                <TableHead class="w-[100px] cursor-pointer select-none" @click="toggleSort('weight')">
                  <span class="flex items-center gap-1">
                    Peso
                    <component :is="getSortIcon('weight')" class="h-3 w-3" />
                  </span>
                </TableHead>
                <TableHead class="w-[100px] cursor-pointer select-none" @click="toggleSort('priority')">
                  <span class="flex items-center gap-1">
                    Prioridad
                    <component :is="getSortIcon('priority')" class="h-3 w-3" />
                  </span>
                </TableHead>
                <TableHead class="w-[100px] cursor-pointer select-none" @click="toggleSort('is_enabled')">
                  <span class="flex items-center gap-1">
                    Estado
                    <component :is="getSortIcon('is_enabled')" class="h-3 w-3" />
                  </span>
                </TableHead>
                <TableHead class="w-[200px]">Patrones</TableHead>
                <TableHead class="w-[120px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-for="intent in paginatedIntents" :key="intent.id">
                <!-- Data Row -->
                <TableRow class="group">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-7 w-7"
                      @click="toggleExpand(intent.id)"
                    >
                      <ChevronDown v-if="expandedRowIds.has(intent.id)" class="h-4 w-4 transition-transform" />
                      <ChevronRight v-else class="h-4 w-4 transition-transform" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <code class="rounded bg-muted px-2 py-1 text-sm">{{ intent.intent_key }}</code>
                  </TableCell>
                  <TableCell class="font-medium">{{ intent.name }}</TableCell>
                  <TableCell>
                    <Badge :variant="getWeightVariant(intent.weight)">
                      {{ intent.weight.toFixed(2) }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span class="inline-block rounded bg-muted px-2 py-1 text-sm font-semibold">
                      {{ intent.priority }}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge :variant="intent.is_enabled ? 'success' : 'secondary'">
                      {{ intent.is_enabled ? 'Activo' : 'Inactivo' }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div class="flex flex-wrap gap-1.5">
                      <TooltipProvider v-if="getLemmaCount(intent) > 0">
                        <Tooltip>
                          <TooltipTrigger as-child>
                            <span class="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                              <BookOpen class="h-3 w-3" /> {{ getLemmaCount(intent) }}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Lemmas</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider v-if="getPhraseCount(intent) > 0">
                        <Tooltip>
                          <TooltipTrigger as-child>
                            <span class="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                              <MessageSquare class="h-3 w-3" /> {{ getPhraseCount(intent) }}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Frases</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider v-if="getConfirmationCount(intent) > 0">
                        <Tooltip>
                          <TooltipTrigger as-child>
                            <span class="inline-flex items-center gap-1 rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                              <CheckCircle class="h-3 w-3" /> {{ getConfirmationCount(intent) }}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Confirmaciones</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider v-if="getKeywordCount(intent) > 0">
                        <Tooltip>
                          <TooltipTrigger as-child>
                            <span class="inline-flex items-center gap-1 rounded bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-800 dark:bg-pink-900 dark:text-pink-100">
                              <Key class="h-3 w-3" /> {{ getKeywordCount(intent) }}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Keywords</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div class="flex gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger as-child>
                            <Button variant="ghost" size="icon" class="h-8 w-8" @click="openEditDialog(intent)">
                              <Pencil class="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger as-child>
                            <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:text-destructive" @click="handleDeleteIntent(intent)">
                              <Trash2 class="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Eliminar</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>

                <!-- Expanded Row -->
                <TableRow v-if="expandedRowIds.has(intent.id)">
                  <TableCell :colspan="8" class="p-0">
                    <div class="glass-panel m-2 p-4">
                      <Tabs default-value="lemmas">
                        <TabsList>
                          <TabsTrigger value="lemmas" class="gap-1.5">
                            <BookOpen class="h-3.5 w-3.5" />
                            Lemmas ({{ getLemmaCount(intent) }})
                          </TabsTrigger>
                          <TabsTrigger value="phrases" class="gap-1.5">
                            <MessageSquare class="h-3.5 w-3.5" />
                            Frases ({{ getPhraseCount(intent) }})
                          </TabsTrigger>
                          <TabsTrigger value="confirmations" class="gap-1.5">
                            <CheckCircle class="h-3.5 w-3.5" />
                            Confirmaciones ({{ getConfirmationCount(intent) }})
                          </TabsTrigger>
                          <TabsTrigger value="keywords" class="gap-1.5">
                            <Key class="h-3.5 w-3.5" />
                            Keywords ({{ getKeywordCount(intent) }})
                          </TabsTrigger>
                        </TabsList>

                        <!-- Lemmas Tab -->
                        <TabsContent value="lemmas" class="pt-4">
                          <div class="space-y-4">
                            <div class="flex gap-2">
                              <Input
                                v-model="newLemma"
                                placeholder="Agregar lemma (Enter para guardar)"
                                class="max-w-sm"
                                @keyup.enter="addLemma(intent)"
                              />
                              <Button size="icon" @click="addLemma(intent)" :disabled="!newLemma">
                                <Plus class="h-4 w-4" />
                              </Button>
                            </div>
                            <div class="flex flex-wrap gap-2">
                              <RemovableBadge
                                v-for="lemma in getLemmas(intent)"
                                :key="lemma"
                                :label="lemma"
                                @remove="removeLemma(intent, lemma)"
                              />
                              <span v-if="getLemmaCount(intent) === 0" class="text-sm italic text-muted-foreground">
                                No hay lemmas configurados
                              </span>
                            </div>
                          </div>
                        </TabsContent>

                        <!-- Phrases Tab -->
                        <TabsContent value="phrases" class="pt-4">
                          <div class="space-y-4">
                            <div class="flex gap-2">
                              <Input
                                v-model="newPhrase.value"
                                placeholder="Agregar frase"
                                class="flex-1"
                              />
                              <Select v-model="newPhrase.match_type">
                                <SelectTrigger class="w-[150px]">
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
                              <Button size="icon" @click="addPhrase(intent)" :disabled="!newPhrase.value">
                                <Plus class="h-4 w-4" />
                              </Button>
                            </div>
                            <div class="rounded-lg border border-border overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Frase</TableHead>
                                    <TableHead class="w-[120px]">Tipo</TableHead>
                                    <TableHead class="w-[60px]"></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <TableRow v-for="phraseData in getPhrases(intent)" :key="phraseData.phrase">
                                    <TableCell>{{ phraseData.phrase }}</TableCell>
                                    <TableCell>
                                      <Badge :variant="getMatchTypeVariant(phraseData.match_type)">
                                        {{ getMatchTypeLabel(phraseData.match_type) }}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        class="h-7 w-7 text-destructive hover:text-destructive"
                                        @click="removePhrase(intent, phraseData.phrase)"
                                      >
                                        <Trash2 class="h-3.5 w-3.5" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                  <TableRow v-if="getPhrases(intent).length === 0">
                                    <TableCell :colspan="3" class="text-center text-muted-foreground italic">
                                      No hay frases configuradas
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </TabsContent>

                        <!-- Confirmations Tab -->
                        <TabsContent value="confirmations" class="pt-4">
                          <div class="space-y-4">
                            <div class="flex gap-2">
                              <Input
                                v-model="newConfirmation.value"
                                placeholder="Agregar confirmacion"
                                class="flex-1"
                              />
                              <Select v-model="newConfirmation.match_type">
                                <SelectTrigger class="w-[150px]">
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
                              <Button size="icon" @click="addConfirmation(intent)" :disabled="!newConfirmation.value">
                                <Plus class="h-4 w-4" />
                              </Button>
                            </div>
                            <div class="rounded-lg border border-border overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Confirmacion</TableHead>
                                    <TableHead class="w-[120px]">Tipo</TableHead>
                                    <TableHead class="w-[60px]"></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <TableRow v-for="confData in getConfirmations(intent)" :key="confData.pattern">
                                    <TableCell>{{ confData.pattern }}</TableCell>
                                    <TableCell>
                                      <Badge :variant="getMatchTypeVariant(confData.pattern_type)">
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
                                              class="h-7 w-7"
                                              disabled
                                            >
                                              <Trash2 class="h-3.5 w-3.5" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Eliminar via edicion de intent</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </TableCell>
                                  </TableRow>
                                  <TableRow v-if="getConfirmations(intent).length === 0">
                                    <TableCell :colspan="3" class="text-center text-muted-foreground italic">
                                      No hay confirmaciones configuradas
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </TabsContent>

                        <!-- Keywords Tab -->
                        <TabsContent value="keywords" class="pt-4">
                          <div class="space-y-4">
                            <div class="flex gap-2">
                              <Input
                                v-model="newKeyword"
                                placeholder="Agregar keyword (Enter para guardar)"
                                class="max-w-sm"
                                @keyup.enter="addKeyword(intent)"
                              />
                              <Button size="icon" @click="addKeyword(intent)" :disabled="!newKeyword">
                                <Plus class="h-4 w-4" />
                              </Button>
                            </div>
                            <div class="flex flex-wrap gap-2">
                              <RemovableBadge
                                v-for="keyword in getKeywords(intent)"
                                :key="keyword"
                                :label="keyword"
                                @remove="removeKeyword(intent, keyword)"
                              />
                              <span v-if="getKeywordCount(intent) === 0" class="text-sm italic text-muted-foreground">
                                No hay keywords configurados
                              </span>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </TableCell>
                </TableRow>
              </template>
            </TableBody>
          </Table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between pt-2">
          <p class="text-sm text-muted-foreground">
            Mostrando {{ paginationStart }} a {{ paginationEnd }} de {{ sortedIntents.length }} intents
          </p>
          <div class="flex items-center gap-2">
            <Select v-model="rowsPerPageStr">
              <SelectTrigger class="w-[80px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <div class="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                class="h-8 w-8"
                :disabled="currentPage === 1"
                @click="currentPage = 1"
              >
                <ChevronsLeft class="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                class="h-8 w-8"
                :disabled="currentPage === 1"
                @click="currentPage--"
              >
                <ChevronLeft class="h-4 w-4" />
              </Button>
              <span class="flex items-center px-2 text-sm text-muted-foreground">
                {{ currentPage }} / {{ totalPages }}
              </span>
              <Button
                variant="outline"
                size="icon"
                class="h-8 w-8"
                :disabled="currentPage >= totalPages"
                @click="currentPage++"
              >
                <ChevronRight class="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                class="h-8 w-8"
                :disabled="currentPage >= totalPages"
                @click="currentPage = totalPages"
              >
                <ChevronsRight class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog :open="showDialog" @update:open="(v: boolean) => { if (!v) closeDialog() }">
      <DialogContent class="glass-dialog sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{{ dialogTitle() }}</DialogTitle>
          <DialogDescription class="sr-only">
            {{ isEditing() ? 'Editar un intent existente' : 'Crear un nuevo intent para el dominio' }}
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-2">
          <div class="space-y-1">
            <label for="intent_key" class="text-sm font-medium text-foreground">Intent Key *</label>
            <Input
              id="intent_key"
              v-model="formData.intent_key"
              :disabled="isEditing()"
              placeholder="ej: check_stock, request_price"
            />
            <p class="text-xs text-muted-foreground">Identificador unico del intent (snake_case)</p>
          </div>

          <div class="space-y-1">
            <label for="name" class="text-sm font-medium text-foreground">Nombre *</label>
            <Input
              id="name"
              v-model="formData.name"
              placeholder="ej: Consulta de Stock"
            />
          </div>

          <div class="space-y-1">
            <label for="description" class="text-sm font-medium text-foreground">Descripcion</label>
            <Textarea
              id="description"
              :model-value="formData.description ?? ''"
              @update:model-value="(v: string) => formData.description = v"
              :rows="3"
              placeholder="Descripcion del intent y cuando se activa"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label for="weight" class="text-sm font-medium text-foreground">Peso</label>
              <Input
                id="weight"
                type="number"
                :min="0"
                :max="9.99"
                step="0.01"
                v-model.number="formData.weight"
              />
            </div>
            <div class="space-y-1">
              <label for="priority" class="text-sm font-medium text-foreground">Prioridad</label>
              <Input
                id="priority"
                type="number"
                :min="0"
                :max="100"
                step="1"
                v-model.number="formData.priority"
              />
            </div>
          </div>

          <div class="flex gap-6">
            <div class="flex items-center gap-2">
              <Checkbox
                id="is_enabled"
                :checked="formData.is_enabled"
                @update:checked="(v: boolean) => formData.is_enabled = v"
              />
              <label for="is_enabled" class="text-sm font-medium text-foreground">Activo</label>
            </div>
            <div class="flex items-center gap-2">
              <Checkbox
                id="exact_match"
                :checked="formData.exact_match"
                @update:checked="(v: boolean) => formData.exact_match = v"
              />
              <label for="exact_match" class="text-sm font-medium text-foreground">Match Exacto</label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="closeDialog">Cancelar</Button>
          <Button @click="saveIntent" :disabled="saving" class="gap-2">
            <RefreshCw v-if="saving" class="h-4 w-4 animate-spin" />
            <Check v-else class="h-4 w-4" />
            {{ submitLabel() }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation -->
    <ConfirmDialog />

    <!-- Toast (kept PrimeVue) -->
    <Toast />

    <!-- Seed Dialog -->
    <Dialog :open="showSeedDialog" @update:open="(v: boolean) => { if (!v) closeSeedDialog() }">
      <DialogContent class="glass-dialog sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Sembrar Intents por Defecto</DialogTitle>
          <DialogDescription class="sr-only">
            Crear intents predefinidos para el dominio seleccionado
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-2">
          <p class="text-sm text-foreground">
            Esto creara los intents predefinidos para el dominio
            <strong>{{ selectedDomain ? getDomainName(selectedDomain) : '' }}</strong>.
          </p>

          <div class="flex items-center gap-2">
            <Checkbox
              id="seedOverwrite"
              :checked="seedOverwrite"
              @update:checked="(v: boolean) => seedOverwrite = v"
            />
            <label for="seedOverwrite" class="text-sm font-medium text-foreground">Sobrescribir intents existentes</label>
          </div>

          <Alert v-if="seedOverwrite" variant="destructive">
            <AlertDescription>
              Los intents existentes con las mismas claves seran reemplazados.
            </AlertDescription>
          </Alert>

          <!-- Seed Results -->
          <div v-if="lastSeedResult">
            <Alert :variant="lastSeedResult.success ? 'default' : 'destructive'">
              <AlertDescription>
                <div>
                  <strong>{{ lastSeedResult.added }}</strong> intents creados,
                  <strong>{{ lastSeedResult.skipped }}</strong> omitidos
                </div>
                <div v-if="lastSeedResult.errors?.length" class="mt-2">
                  <small class="text-muted-foreground">Errores:</small>
                  <ul class="mt-1 list-disc pl-5 text-sm">
                    <li v-for="(error, idx) in lastSeedResult.errors" :key="idx">{{ error }}</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="closeSeedDialog">Cancelar</Button>
          <Button @click="seedDefaults" :disabled="seedingIntents" class="gap-2">
            <RefreshCw v-if="seedingIntents" class="h-4 w-4 animate-spin" />
            <Database v-else class="h-4 w-4" />
            Sembrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Cache Stats Dialog -->
    <Dialog :open="showCacheStatsDialog" @update:open="(v: boolean) => { if (!v) closeCacheStatsDialog() }">
      <DialogContent class="glass-dialog sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Estadisticas del Cache</DialogTitle>
          <DialogDescription class="sr-only">
            Metricas de rendimiento del cache de intents
          </DialogDescription>
        </DialogHeader>
        <div v-if="cacheStats" class="py-2">
          <div class="grid grid-cols-3 gap-3">
            <div class="glass-panel flex flex-col items-center rounded-lg p-3 text-center">
              <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Memory Hits</span>
              <span class="mt-1 text-xl font-bold text-foreground">{{ cacheStats.memory_hits }}</span>
            </div>
            <div class="glass-panel flex flex-col items-center rounded-lg p-3 text-center">
              <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Memory Misses</span>
              <span class="mt-1 text-xl font-bold text-foreground">{{ cacheStats.memory_misses }}</span>
            </div>
            <div class="flex flex-col items-center rounded-lg bg-primary p-3 text-center text-primary-foreground">
              <span class="text-xs font-medium uppercase tracking-wide">Memory Hit Rate</span>
              <span class="mt-1 text-xl font-bold">{{ (cacheStats.memory_hit_rate * 100).toFixed(1) }}%</span>
            </div>
            <div class="glass-panel flex flex-col items-center rounded-lg p-3 text-center">
              <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Redis Hits</span>
              <span class="mt-1 text-xl font-bold text-foreground">{{ cacheStats.redis_hits }}</span>
            </div>
            <div class="glass-panel flex flex-col items-center rounded-lg p-3 text-center">
              <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Redis Misses</span>
              <span class="mt-1 text-xl font-bold text-foreground">{{ cacheStats.redis_misses }}</span>
            </div>
            <div class="flex flex-col items-center rounded-lg bg-primary p-3 text-center text-primary-foreground">
              <span class="text-xs font-medium uppercase tracking-wide">Redis Hit Rate</span>
              <span class="mt-1 text-xl font-bold">{{ (cacheStats.redis_hit_rate * 100).toFixed(1) }}%</span>
            </div>
            <div class="glass-panel flex flex-col items-center rounded-lg p-3 text-center">
              <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">DB Loads</span>
              <span class="mt-1 text-xl font-bold text-foreground">{{ cacheStats.db_loads }}</span>
            </div>
            <div class="glass-panel flex flex-col items-center rounded-lg p-3 text-center">
              <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Invalidaciones</span>
              <span class="mt-1 text-xl font-bold text-foreground">{{ cacheStats.invalidations }}</span>
            </div>
            <div class="glass-panel flex flex-col items-center rounded-lg p-3 text-center">
              <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Orgs en Cache</span>
              <span class="mt-1 text-xl font-bold text-foreground">{{ cacheStats.cached_organizations }}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="closeCacheStatsDialog">Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Import Dialog -->
    <Dialog :open="showImportDialog" @update:open="(v: boolean) => { if (!v) closeImportDialog() }">
      <DialogContent class="glass-dialog sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importar Intents</DialogTitle>
          <DialogDescription class="sr-only">
            Importar intents desde un archivo JSON exportado
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-2">
          <div class="space-y-1">
            <label class="text-sm font-medium text-foreground">Archivo JSON</label>
            <Input
              type="file"
              accept=".json"
              @change="onFileInput"
              class="cursor-pointer"
            />
            <p class="text-xs text-muted-foreground">Formato: archivo JSON exportado desde esta pagina</p>
          </div>

          <!-- Preview -->
          <div v-if="importPreview.length > 0" class="space-y-2">
            <h4 class="text-sm font-medium text-muted-foreground">
              Vista previa ({{ importPreview.length }} intents)
            </h4>
            <div class="rounded-lg border border-border overflow-hidden max-h-[250px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead class="w-[100px]">Prioridad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="item in importPreview.slice(0, importPreviewLimit)" :key="item.intent_key">
                    <TableCell class="font-mono text-sm">{{ item.intent_key }}</TableCell>
                    <TableCell>{{ item.name }}</TableCell>
                    <TableCell>{{ item.priority }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <Button
              v-if="importPreview.length > importPreviewLimit"
              variant="link"
              size="sm"
              @click="importPreviewLimit = importPreview.length"
            >
              Ver todos ({{ importPreview.length }})
            </Button>
          </div>

          <!-- Import Results -->
          <div v-if="lastImportResult">
            <Alert :variant="lastImportResult.success ? 'default' : 'destructive'">
              <AlertDescription>
                <div>
                  <strong>{{ lastImportResult.created }}</strong> intents importados,
                  <strong>{{ lastImportResult.skipped }}</strong> omitidos
                </div>
                <div v-if="lastImportResult.errors?.length" class="mt-2">
                  <small class="text-muted-foreground">Errores:</small>
                  <ul class="mt-1 list-disc pl-5 text-sm">
                    <li v-for="(error, idx) in lastImportResult.errors" :key="idx">{{ error }}</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="closeImportDialog">Cancelar</Button>
          <Button
            @click="importIntents"
            :disabled="importing || importPreview.length === 0"
            class="gap-2"
          >
            <RefreshCw v-if="importing" class="h-4 w-4 animate-spin" />
            <Upload v-else class="h-4 w-4" />
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import Toast from 'primevue/toast'

// shadcn-vue components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge, RemovableBadge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import { useConfirmDialog } from '@/composables/useConfirmDialog'

// Lucide icons
import {
  Tags,
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Database,
  Download,
  Upload,
  BarChart3,
  RefreshCw,
  List,
  CheckCircle,
  Inbox,
  BookOpen,
  MessageSquare,
  Key,
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-vue-next'

// Composables
import { useDomainIntents } from '@/composables/useDomainIntents'
import { useIntentPatterns } from '@/composables/useIntentPatterns'
import { useIntentDialog } from '@/composables/useIntentDialog'
import type { DomainIntent } from '@/types/domainIntents.types'

// Confirm dialog composable (shadcn-vue based)
const confirmDialog = useConfirmDialog()

// Domain Intents composable
const {
  selectedDomain,
  intents,
  loading,
  searchQuery,
  showOnlyEnabled,
  availableDomains,
  // Cache stats
  cacheStats,
  loadingCacheStats,
  showCacheStatsDialog,
  // Seed
  seedingIntents,
  showSeedDialog,
  seedOverwrite,
  lastSeedResult,
  // Import/Export
  importing,
  showImportDialog,
  importPreview,
  lastImportResult,
  // Computed
  organizationId,
  enabledIntents,
  totalPatterns,
  // Domain helpers
  getDomainName,
  getDomainIcon,
  getDomainColor,
  // Actions
  loadIntents,
  onSearch,
  deleteIntent,
  invalidateCache,
  // Cache stats actions
  fetchCacheStats,
  closeCacheStatsDialog,
  // Seed actions
  openSeedDialog,
  closeSeedDialog,
  seedDefaults,
  // Export/Import actions
  exportIntents,
  openImportDialog,
  closeImportDialog,
  handleImportFileChange,
  importIntents
} = useDomainIntents()

// Intent Patterns composable
const {
  newLemma,
  newKeyword,
  newPhrase,
  newConfirmation,
  matchTypeOptions,
  getLemmas,
  getPhrases,
  getConfirmations,
  getKeywords,
  getLemmaCount,
  getPhraseCount,
  getConfirmationCount,
  getKeywordCount,
  getMatchTypeLabel,
  getMatchTypeSeverity,
  addLemma,
  addKeyword,
  addPhrase,
  addConfirmation,
  removeLemma,
  removePhrase,
  removeKeyword
} = useIntentPatterns(selectedDomain, loadIntents)

// Intent Dialog composable
const {
  showDialog,
  saving,
  formData,
  isEditing,
  dialogTitle,
  submitLabel,
  openCreateDialog,
  openEditDialog,
  closeDialog,
  saveIntent
} = useIntentDialog(selectedDomain, organizationId, loadIntents)

// =========================================================================
// Expandable rows state
// =========================================================================
const expandedRowIds = reactive(new Set<string>())

function toggleExpand(id: string) {
  if (expandedRowIds.has(id)) {
    expandedRowIds.delete(id)
  } else {
    expandedRowIds.add(id)
  }
}

// =========================================================================
// Sort + Pagination state
// =========================================================================
type SortField = 'intent_key' | 'name' | 'weight' | 'priority' | 'is_enabled'

const sortField = ref<SortField | null>(null)
const sortOrder = ref<'asc' | 'desc'>('asc')
const currentPage = ref(1)
const rowsPerPage = ref(10)

// String wrapper for Select component (which uses string values)
const rowsPerPageStr = computed({
  get: () => String(rowsPerPage.value),
  set: (v: string) => {
    rowsPerPage.value = Number(v)
    currentPage.value = 1
  }
})

function toggleSort(field: SortField) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
  currentPage.value = 1
}

function getSortIcon(field: SortField) {
  if (sortField.value !== field) return ArrowUpDown
  return sortOrder.value === 'asc' ? ArrowUp : ArrowDown
}

const sortedIntents = computed(() => {
  if (!sortField.value) return intents.value

  const field = sortField.value
  const order = sortOrder.value === 'asc' ? 1 : -1

  return [...intents.value].sort((a, b) => {
    const aVal = a[field]
    const bVal = b[field]

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal) * order
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal - bVal) * order
    }
    if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
      return (Number(aVal) - Number(bVal)) * order
    }
    return 0
  })
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedIntents.value.length / rowsPerPage.value))
)

const paginatedIntents = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value
  return sortedIntents.value.slice(start, start + rowsPerPage.value)
})

const paginationStart = computed(() =>
  sortedIntents.value.length === 0 ? 0 : (currentPage.value - 1) * rowsPerPage.value + 1
)

const paginationEnd = computed(() =>
  Math.min(currentPage.value * rowsPerPage.value, sortedIntents.value.length)
)

// Reset page when intents change
watch(() => intents.value.length, () => {
  currentPage.value = 1
})

// =========================================================================
// Delete intent (using shadcn ConfirmDialog instead of PrimeVue useConfirm)
// =========================================================================
async function handleDeleteIntent(intent: DomainIntent) {
  const confirmed = await confirmDialog.confirm({
    title: 'Confirmar eliminacion',
    message: `Eliminar el intent "${intent.name}"? Esta accion no se puede deshacer.`,
    confirmLabel: 'Eliminar',
    variant: 'destructive'
  })
  if (confirmed) {
    await deleteIntent(intent)
  }
}

// =========================================================================
// UI helpers
// =========================================================================
function getWeightVariant(weight: number): 'destructive' | 'warning' | 'success' | 'secondary' {
  if (weight >= 1.5) return 'destructive'
  if (weight >= 1.2) return 'warning'
  if (weight >= 1.0) return 'success'
  return 'secondary'
}

function getMatchTypeVariant(matchType: string | null): 'success' | 'info' | 'warning' | 'secondary' {
  switch (matchType) {
    case 'exact':
      return 'success'
    case 'contains':
      return 'info'
    case 'prefix':
      return 'warning'
    default:
      return 'secondary'
  }
}

// =========================================================================
// File input handler (replacing PrimeVue FileUpload)
// =========================================================================
function onFileInput(event: Event) {
  const target = event.target as HTMLInputElement
  handleImportFileChange(target.files?.[0] ?? null)
}

// Import preview limit
const importPreviewLimit = ref(5)

// Reset preview limit when dialog opens
watch(showImportDialog, (v) => {
  if (v) importPreviewLimit.value = 5
})
</script>
