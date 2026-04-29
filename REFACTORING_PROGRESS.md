# 🚀 Architecture Refactoring Progress

## Current Status: Phase 1 ✅ Phase 2 🔄

**Last Updated**: 2026-04-29  
**Next Session**: Continue Phase 2 (Zustand Store Implementation)

---

## ✅ Phase 1: Feature-Sliced Design 完了

### 新ディレクトリ構造
```
src/
├── shared/              # 共有層
│   ├── constants/       # グローバル定数（CATEGORY_IDS等）
│   ├── types/           # 共通型（Category, ActivityEntry等）
│   ├── lib/             # ユーティリティ（id, logger, alerts）
│   └── hooks/           # 共有フック（useModalNavigation）
│
├── features/
│   ├── inventory/       # ドメイン1: 在庫管理
│   │   ├── ui/          # InventoryItemCard など
│   │   ├── store/       # Zustand Store (Phase 2)
│   │   ├── types/       # スキーマ & 型定義
│   │   ├── lib/         # price.ts, itemSync.ts等
│   │   └── hooks/       # useInventory (deprecated)
│   │
│   └── meals/           # ドメイン2: 献立記録
│       ├── ui/
│       ├── store/       # (Phase 2)
│       ├── types/
│       ├── lib/
│       └── hooks/
│
└── App.tsx              # (Phase 4で再設計)
```

### 作成ファイル（全31個）
- ✅ 14個の新ディレクトリ作成
- ✅ 9個のメイン typescript ファイル
- ✅ 3個の公開API index.ts
- ✅ Zod スキーマ定義（inventory, meals）
- ✅ InventoryItemCard コンポーネント移動・import更新

---

## 🔄 Phase 2: Zod スキーマ + Zustand Store（進行中）

### 完了
- ✅ `src/features/inventory/types/schema.ts` - Zod スキーマ定義済み
- ✅ `src/features/meals/types/schema.ts` - Zod スキーマ定義済み
- ⏳ `npm install zod zustand` - インストール中（要確認）

### 次のステップ（優先順）
1. **npm パッケージ確認** → `npm install zod zustand --save`
2. **Zustand Store実行** → `src/features/inventory/store/index.ts`
3. **Persist + 正規化ロジック** → unopenedItemsByName 計算
4. **Data Migration** → 既存 localStorage の自動アップグレード
5. **型エラー解決** → `npm run build`

---

## 📊 実装の関連性

```
Phase 1 ✅ (ディレクトリ構造)
    ↓
Phase 2 🔄 (Zod + Zustand Store)
    ↓
Phase 3 (React Hook Form)
    ↓
Phase 4 (Wouter Routing)
```

---

## 🎯 重要な決定事項

| 項目 | 決定 |
|------|------|
| **マイグレーション** | Zustand Persist の `migrate()` で自動 |
| **正規化** | `entities + ids + unopenedItemsByName` インデックス |
| **フォーム** | 各モーダル内で `useForm` 独立管理 |
| **ルーティング** | タブのみ URL化（/stock, /meals） |
| **ロールアウト** | Feature Flag で段階的切り替え |
| **既存ファイル** | 後方互換性維持のため据置 |

---

## 🛠️ 帰宅後の再開チェックリスト

```bash
# 1. npm パッケージ確認
npm install zod zustand --save

# 2. 開発環境起動
npm run dev

# 3. TypeScript チェック
npm run build

# 4. ブラウザで既存UI確認
# http://localhost:5173
```

---

## 📚 詳細情報

> より詳しい実装内容・マイグレーション戦略・次の具体的ステップは、  
> `/memories/session/plan.md` を参照してください。  
> （セッションメモリに保存済み）

**主な参照ファイル**:
- 新 Zod スキーマ: `src/features/*/types/schema.ts`
- 新型定義: `src/features/*/types/index.ts`
- 既存型（段階廃止）: `src/types.ts`

---

**Next**: Zustand Store 実装 → Phase 2 完成
