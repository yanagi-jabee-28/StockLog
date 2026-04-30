# StockLog 無停止リファクタリング計画

この計画は、現在の見た目と機能を完全に維持したまま（すべての段階で `npm run dev` の結果が変わらないように）、巨大化した `App.tsx` を分割し、管理しやすいアーキテクチャへと移行するための5つのステップです。

## 目的
- 責務の明確化（UI描画とロジックの分離）
- ディレクトリ構造の最適化
- コードの可読性と保守性の向上
- 見た目や振る舞い（DOM構造やTailwind CSSクラス）は一切変更しない

## 段階別計画

### 第1段階：思考の純化（表示ロジックの抽出）
UIの変更を一切伴わず、`App.tsx` 内で計算されている表示用データを別ファイルに隔離する。
- [x] `src/hooks/useInventoryView.ts` を新規作成。
- [x] `App.tsx` から `filteredItems`, `activeItems`, `unopenedItems`, `unopenedGroups`, `totalStockByRootId` の演算ロジックを移行。
- [x] `App.tsx` で `useInventoryView` を呼び出すように修正。

### 第2段階：外殻の剥離（Sidebarのコンポーネント化）
`App.tsx` の左側のサイドバーを分離する。
- [x] `src/components/layout/Sidebar.tsx` を新規作成。
- [x] `App.tsx` の `<aside className="hidden md:flex...">` 部分を移行。
- [x] 必要なPropsを定義し、`App.tsx` で `<Sidebar />` を呼び出す。

### 第3段階：モバイル装甲の分離（MobileHeaderのコンポーネント化）
モバイル画面用のヘッダーを分離する。
- [x] `src/components/layout/MobileHeader.tsx` を新規作成。
- [x] `App.tsx` の `<header className="md:hidden...">` 部分を移行。
- [x] 必要なPropsを定義し、`App.tsx` で `<MobileHeader />` を呼び出す。

### 第4段階：献立記録の独立（MealViewのコンポーネント化）
中央のメインコンテンツ部分から、献立記録の画面を切り離す。
- [x] `src/components/features/meals/MealView.tsx` を新規作成。
- [x] `App.tsx` の `{activeTab === 'meals' ? (...)` 内の献立関連のUIを移行。
- [x] 必要なPropsを定義し、`App.tsx` で `<MealView />` を呼び出す。

### 第5段階：在庫管理の独立とApp.tsxの昇華
在庫画面と履歴画面を抽出し、`App.tsx` を純粋な司令塔へ変貌させる。
- [x] `src/components/features/inventory/InventoryView.tsx` を新規作成。
- [x] `App.tsx` に残っている在庫一覧と履歴表示のUIを移行。
- [x] 第1段階で作った `useInventoryView` を `InventoryView.tsx` 内に移動。
- [x] `App.tsx` を全体のルーティング・状態管理のみを行うように整理。

## 進行のルール
- 各段階が完了するごとに動作確認を行い、見た目・機能が損なわれていないことを保証する。
- 既存のDOM構造やクラス名はそのままコピー＆ペーストで移行し、書き換えない。
