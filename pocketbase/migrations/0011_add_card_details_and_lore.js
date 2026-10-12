migrate(
  (app) => {
    // 0011_add_card_details_and_lore.js
    // 1. Adiciona novos campos à coleção 'cards'
    const cards = app.findCollectionByNameOrId('cards')

    // Custo de invocação (JSON)
    if (!cards.fields.getByName('cost')) {
      cards.fields.add(
        new JSONField({
          name: 'cost',
          required: false,
        }),
      )
    }

    // Classe (texto simples: Guerreiro, Mago, Fera, Veículo etc.)
    if (!cards.fields.getByName('card_archetype')) {
      cards.fields.add(
        new TextField({
          name: 'card_archetype',
          required: false,
        }),
      )
    }

    // Escola Mágica (texto simples: Abjuração, Conjuração, Encantamento etc.)
    if (!cards.fields.getByName('magic_school')) {
      cards.fields.add(
        new TextField({
          name: 'magic_school',
          required: false,
        }),
      )
    }

    // Raça (texto simples: Dragão, Humano, Peixe etc.)
    if (!cards.fields.getByName('race')) {
      cards.fields.add(
        new TextField({
          name: 'race',
          required: false,
        }),
      )
    }

    // Modo de Invocação (texto simples: Sinc, Fusion, Dimension etc.)
    if (!cards.fields.getByName('summon_mode')) {
      cards.fields.add(
        new TextField({
          name: 'summon_mode',
          required: false,
        }),
      )
    }

    // Texto de Habilidades (texto)
    if (!cards.fields.getByName('abilities')) {
      cards.fields.add(
        new TextField({
          name: 'abilities',
          required: false,
        }),
      )
    }

    // Texto de Efeitos (texto)
    if (!cards.fields.getByName('effects')) {
      cards.fields.add(
        new TextField({
          name: 'effects',
          required: false,
        }),
      )
    }

    app.save(cards)

    // 2. Cria a coleção lore_pages (História / Lore)
    if (!app.hasTable('lore_pages')) {
      const lorePages = new Collection({
        name: 'lore_pages',
        type: 'base',
        listRule: "@request.auth.id != '' && owner = @request.auth.id",
        viewRule: "@request.auth.id != '' && owner = @request.auth.id",
        createRule: "@request.auth.id != '' && @request.body.owner = @request.auth.id",
        updateRule: "@request.auth.id != '' && owner = @request.auth.id",
        deleteRule: "@request.auth.id != '' && owner = @request.auth.id",
        fields: [
          {
            name: 'owner',
            type: 'relation',
            required: true,
            collectionId: '_pb_users_auth_',
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'title', type: 'text', required: true },
          { name: 'content', type: 'text', required: false },
          { name: 'order', type: 'number', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_lore_pages_owner_order ON lore_pages (owner, "order" ASC, created ASC)',
        ],
      })
      app.save(lorePages)
    }
  },
  (app) => {
    // Reverter lore_pages
    try {
      const lorePages = app.findCollectionByNameOrId('lore_pages')
      app.delete(lorePages)
    } catch (_) {}

    // Reverter campos de cards
    try {
      const cards = app.findCollectionByNameOrId('cards')
      const fieldsToRemove = [
        'cost',
        'card_archetype',
        'magic_school',
        'race',
        'summon_mode',
        'abilities',
        'effects',
      ]
      for (let i = 0; i < fieldsToRemove.length; i++) {
        const name = fieldsToRemove[i]
        if (cards.fields.getByName(name)) {
          cards.fields.removeByName(name)
        }
      }
      app.save(cards)
    } catch (_) {}
  },
)
