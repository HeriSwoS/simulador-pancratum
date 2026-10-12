migrate(
  (app) => {
    // 1. Atualizar valores permitidos do campo 'card_type' na coleção cards
    const cards = app.findCollectionByNameOrId('cards')
    const typeField = cards.fields.getByName('card_type')
    if (typeField) {
      typeField.values = [
        'personagem',
        'criatura',
        'magia',
        'armadilha',
        'equipamento',
        // mantemos temporariamente os legados para não falhar validação de linhas existentes antes do mapeamento
        'guerreiro',
        'arma',
        'armadura',
        'evento',
        'reliquia',
      ]
      app.save(cards)
    }

    // 2. Mapear cartas que tenham tipos antigos para os novos:
    // guerreiro -> personagem, arma/armadura -> equipamento, evento -> magia, reliquia -> equipamento
    app
      .db()
      .newQuery("UPDATE cards SET card_type = 'personagem' WHERE card_type = 'guerreiro'")
      .execute()
    app
      .db()
      .newQuery(
        "UPDATE cards SET card_type = 'equipamento' WHERE card_type IN ('arma', 'armadura', 'reliquia')",
      )
      .execute()
    app.db().newQuery("UPDATE cards SET card_type = 'magia' WHERE card_type = 'evento'").execute()

    // 3. Agora fixamos os valores de 'card_type' apenas nos 5 novos tipos oficiais
    const cardsFinal = app.findCollectionByNameOrId('cards')
    const finalTypeField = cardsFinal.fields.getByName('card_type')
    if (finalTypeField) {
      finalTypeField.values = ['personagem', 'criatura', 'magia', 'armadilha', 'equipamento']
      app.save(cardsFinal)
    }

    // 4. Mapear cores antigas salvas para as novas simples caso existam
    app.db().newQuery("UPDATE cards SET color = 'amarelo' WHERE color = 'dourado'").execute()
    app.db().newQuery("UPDATE cards SET color = 'cinza' WHERE color = 'neutro'").execute()

    // 5. Deletar baralhos de seed / demonstração (ex: 'Confronto dos Heróis' do admin inicial)
    try {
      const demoDeck = app.findFirstRecordByData('decks', 'name', 'Confronto dos Heróis')
      if (demoDeck) app.delete(demoDeck)
    } catch (_) {}

    // Limpar referências a cartas seed em baralhos do usuário antes de deletar as cartas
    // para evitar que um deck quebre por chave estrangeira
    const seedNames = [
      'Davi',
      'Golias',
      'Sansão',
      'Gideão',
      'Josué',
      'Moisés',
      'Espada do Espírito',
      'Funda de Davi',
      'Lança de Golias',
      'Escudo da Fé',
      'Capacete da Salvação',
      'Armadura Completa de Deus',
      'Chuva de Pedras',
      'Força Divina',
      'Arca da Aliança',
    ]

    const seedCardIds = []
    for (const name of seedNames) {
      try {
        const c = app.findFirstRecordByData('cards', 'name', name)
        if (c && c.getBool('is_public')) {
          seedCardIds.push(c.id)
        }
      } catch (_) {}
    }

    if (seedCardIds.length > 0) {
      const decksCol = app.findCollectionByNameOrId('decks')
      const allDecks = app.findRecordsByFilter('decks', '', '', 100, 0)
      for (const d of allDecks) {
        let changed = false
        const mainChar = d.getString('main_character')
        if (mainChar && seedCardIds.indexOf(mainChar) !== -1) {
          d.set('main_character', '')
          changed = true
        }

        const legendaries = d.getStringSlice('legendary_cards')
        if (legendaries && legendaries.length) {
          const filteredLeg = legendaries.filter((id) => seedCardIds.indexOf(id) === -1)
          if (filteredLeg.length !== legendaries.length) {
            d.set('legendary_cards', filteredLeg)
            changed = true
          }
        }

        let rawItems = []
        try {
          rawItems = JSON.parse(d.getString('items')) ?? []
        } catch (_) {}
        if (Array.isArray(rawItems) && rawItems.length) {
          const filteredItems = rawItems.filter((it) => it && seedCardIds.indexOf(it.cardId) === -1)
          if (filteredItems.length !== rawItems.length) {
            d.set('items', filteredItems)
            changed = true
          }
        }

        if (changed) {
          app.save(d)
        }
      }

      // 6. Deletar as 15 cartas oficiais / seed
      for (const cardId of seedCardIds) {
        try {
          const rec = app.findCollectionByNameOrId('cards')
          const cardRec = app.findFirstRecordByData('cards', 'id', cardId)
          app.delete(cardRec)
        } catch (_) {}
      }
    }
  },
  () => {},
)
