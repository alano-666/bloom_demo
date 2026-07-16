#!/bin/zsh
if [[ -n "$ALIBABA_BAILIAN_API_KEY" ]]; then
  export ALIBABA_BAILIAN_BASE_URL="${ALIBABA_BAILIAN_BASE_URL:-https://ws-9wb6f65uvmdt19ua.cn-beijing.maas.aliyuncs.com/compatible-mode/v1}"
  export ALIBABA_BAILIAN_MODEL="${ALIBABA_BAILIAN_MODEL:-qwen-plus}"
fi
if [[ -n "$ZAI_API_KEY" ]]; then
  export ZAI_BASE_URL="${ZAI_BASE_URL:-https://open.bigmodel.cn/api/paas/v4}"
  export ZAI_MODEL="${ZAI_MODEL:-glm-4.5-flash}"
fi
npm run dev --workspace @bloom/api
