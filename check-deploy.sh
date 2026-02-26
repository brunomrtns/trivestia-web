#!/bin/bash

echo "=== Verificação de Deploy Trivestia ==="
echo ""

echo "1. Verificando build local..."
if [ -f "dist/index.html" ]; then
    echo "✅ dist/index.html existe"
    echo "   Tamanho: $(wc -l < dist/index.html) linhas"
else
    echo "❌ dist/index.html não encontrado"
fi

echo ""
echo "2. Verificando arquivos JavaScript..."
js_files=$(find dist/assets -name "*.js" 2>/dev/null | wc -l)
echo "   Arquivos JS: $js_files"

echo ""
echo "3. Verificando sim-core..."
if [ -d "packages/sim-core/dist" ]; then
    echo "✅ sim-core/dist existe"
    echo "   Arquivos: $(ls packages/sim-core/dist | wc -l)"
else
    echo "❌ sim-core/dist não encontrado"
fi

echo ""
echo "4. Testando build..."
npm run build 2>&1 | tail -5

echo ""
echo "5. URLs de produção:"
echo "   Frontend: https://trivestia.vercel.app"
echo "   API: https://trademaster-api.vercel.app"
echo "   API Health: https://trademaster-api.vercel.app/health"

echo ""
echo "6. Testando API de produção..."
curl -s https://trademaster-api.vercel.app/health 2>&1 | head -3 || echo "❌ API não responde"

echo ""
echo "=== Fim da verificação ==="
