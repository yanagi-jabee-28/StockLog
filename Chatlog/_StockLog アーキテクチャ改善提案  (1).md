> From: https://gemini.google.com/app/d9476e90d85a43f4

# you asked

公開サイト: https://yanagi-jabee-28.github.io/StockLog/

GitHub: https://github.com/yanagi-jabee-28/StockLog

管理しやすい体制にしたい。
また，一つのファイルに責務を集中させないようにしたい。
それでいて今の見た目のまま完全に同じように。

使えるライブラリやアルゴリズムは最大限に利用しよう。

---

# gemini response

単一のファイルに集約された巨大な論理構造は、初期開発の速度を保証する一方で、将来の拡張性と保守性を静かに蝕みます。StockLogの美しいUIと堅牢な機能を完全に維持したまま、内部アーキテクチャを洗練された状態へ昇華させるための、最適な責務分割の設計図を提示します。

現在の `App.tsx` は、データのCRUD操作、表示用の複雑な計算（フィルタリングやグループ化）、レイアウトの構築、そしてモーダルの制御という、無数の責務を一身に背負っています。これらを解きほぐし、各モジュールが単一の責務を全うする体制を構築します。

### 1. 空間の再定義：ディレクトリ構造の最適化

機能の境界を明確にするため、コンポーネントをその役割ごとに階層化します。

```text
src/
 ├── components/
 │   ├── layout/          # アプリケーションの骨格
 │   │   ├── Sidebar.tsx
 │   │   └── MobileHeader.tsx
 │   ├── features/        # ドメインに特化したビュー
 │   │   ├── inventory/
 │   │   │   ├── InventoryView.tsx
 │   │   │   └── UnopenedItemGroup.tsx
 │   │   ├── history/
 │   │   │   └── HistoryView.tsx
 │   │   └── meals/
 │   │       └── MealView.tsx
 │   └── ui/              # 汎用的なUI部品（既存のCardやModal等）
 ├── hooks/
 │   ├── useInventory.ts  # 既存（コアデータのCRUD）
 │   ├── useMealLog.ts    # 既存（コアデータのCRUD）
 │   └── useInventoryDerivedState.ts # 新設（表示用データの計算ロジック）
 └── lib/
```

### 2. 思考の抽出：表示ロジックの分離

`App.tsx` の内部で行われている、在庫のフィルタリング、グループ化、総数計算などの複雑な演算を、独立したカスタムフックとして抽出します。これにより、UIコンポーネントは純粋な描画のみに集中できます。

**`src/hooks/useInventoryDerivedState.ts`**
```typescript
import { useMemo } from 'react';
import { InventoryItem } from '../types';
import { compareByExpiryThenName } from '../lib/alerts';

export function useInventoryDerivedState(
  items: InventoryItem[],
  activeCategoryId: string
) {
  // 指定カテゴリのアイテムを抽出・ソート
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (activeCategoryId === 'history') return true;
      return !item.isArchived && item.categoryId === activeCategoryId;
    }).sort((a, b) => {
      if (activeCategoryId === 'history') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      }
      return compareByExpiryThenName(a, b);
    });
  }, [items, activeCategoryId]);

  // 開封済みアイテム
  const activeItems = useMemo(() => {
    return filteredItems.filter(item => item.isOpened).sort((a, b) => {
      const percentDiff = (a.remainingPercent ?? 100) - (b.remainingPercent ?? 100);
      if (percentDiff !== 0) return percentDiff;
      return compareByExpiryThenName(a, b);
    });
  }, [filteredItems]);

  // 未開封アイテムのグループ化
  const unopenedGroups = useMemo(() => {
    const unopened = filteredItems.filter(item => !item.isOpened).sort(compareByExpiryThenName);
    const groups = new Map<string, { name: string; items: InventoryItem[]; totalStock: number }>();

    for (const item of unopened) {
      const key = item.name.trim().toLowerCase();
      const group = groups.get(key);
      if (!group) {
        groups.set(key, { name: item.name, items: [item], totalStock: item.stock });
        continue;
      }
      group.items.push(item);
      group.totalStock += item.stock;
    }
    return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  }, [filteredItems]);

  // ルートIDに基づく総在庫数の計算
  const totalStockByRootId = useMemo(() => {
    const totals = new Map<string, number>();
    for (const item of items) {
      if (item.isArchived) continue;
      const rootId = item.isOpened && item.originalItemId ? item.originalItemId : item.id;
      const current = totals.get(rootId) ?? 0;
      const contribution = item.isOpened ? 1 : item.stock;
      totals.set(rootId, current + contribution);
    }
    return totals;
  }, [items]);

  return { filteredItems, activeItems, unopenedGroups, totalStockByRootId };
}
```

### 3. 領域の分割：Featureコンポーネントの構築

「在庫表示」「履歴表示」など、メイン画面のコンテンツをそれぞれのコンポーネントに分割します。

**`src/components/features/inventory/InventoryView.tsx`**
```tsx
import React from 'react';
import { Plus, Boxes } from 'lucide-react';
import { InventoryItemCard } from '../../ui/InventoryItemCard';
import { useInventoryDerivedState } from '../../../hooks/useInventoryDerivedState';
// 必要な型や関数のインポート...

export function InventoryView({ 
  items, 
  activeCategoryId, 
  categories, 
  onAddItem,
  // その他のイベントハンドラ群...
}) {
  const { activeItems, unopenedGroups, totalStockByRootId, filteredItems } = useInventoryDerivedState(items, activeCategoryId);
  const activeCategory = categories.find(c => c.id === activeCategoryId);

  if (filteredItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        {/* 空状態の描画 */}
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:flex justify-between items-center mb-12 border-b border-gray-100 pb-10">
        <div>
          <p className="text-[10px] font-bold text-violet-600 uppercase tracking-[0.2em] mb-2">Current Category</p>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">
            {activeCategory?.name}
          </h2>
        </div>
        <button onClick={onAddItem} className="...">
          <Plus className="w-5 h-5" />アイテムを追加
        </button>
      </div>

      <div className="space-y-10">
        {/* Active Items 描画 */}
        {/* Unopened Groups 描画 (ここもさらに UnopenedItemGroup.tsx に分割可能) */}
      </div>
    </>
  );
}
```

### 4. オーケストレーターとしての `App.tsx`

各機能を分割した結果、`App.tsx` は細かな計算や描画の責務から解放され、アプリケーションの全体像を指揮する純粋なオーケストレーターへと変貌します。

```tsx
import React, { useState } from 'react';
import { useInventory } from './hooks/useInventory';
import { useMealLog } from './hooks/useMealLog';
import { Sidebar } from './components/layout/Sidebar';
import { MobileHeader } from './components/layout/MobileHeader';
import { InventoryView } from './components/features/inventory/InventoryView';
import { HistoryView } from './components/features/history/HistoryView';
import { MealView } from './components/features/meals/MealView';
import { AddItemModal, SettingsModal, AddMealModal } from './components/ui';

export default function App() {
  const inventory = useInventory();
  const mealLog = useMealLog();
  
  const [activeTab, setActiveTab] = useState<'stock' | 'meals'>('stock');
  const [activeCategoryId, setActiveCategoryId] = useState(inventory.categories[0]?.id || 'fresh');
  
  // モーダル等の各種状態...

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f8f9fa] text-gray-900 overflow-hidden font-sans xl:max-w-[1400px] xl:mx-auto xl:shadow-[0_0_80px_rgba(0,0,0,0.05)] xl:my-6 xl:h-[calc(100vh-3rem)] xl:rounded-[2.5rem] border-gray-100">
      
      <Sidebar 
        categories={inventory.categories}
        activeTab={activeTab}
        activeCategoryId={activeCategoryId}
        onTabChange={setActiveTab}
        onCategoryChange={setActiveCategoryId}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      <MobileHeader 
        /* Sidebarと同様のProps */
      />

      <main className="flex-1 flex flex-col items-center bg-[#fbfbfc] overflow-y-auto relative z-0">
        <div className="w-full max-w-6xl px-4 py-6 md:p-12 shrink-0 mb-28 md:mb-0">
          {activeTab === 'meals' ? (
            <MealView mealLogs={mealLog.mealLogs} /* ... */ />
          ) : activeCategoryId === 'history' ? (
            <HistoryView activities={inventory.activities} /* ... */ />
          ) : (
            <InventoryView 
              items={inventory.items}
              categories={inventory.categories}
              activeCategoryId={activeCategoryId}
              onAddItem={() => setIsAddModalOpen(true)}
              /* その他のハンドラを渡す */
            />
          )}
        </div>
      </main>

      {/* 各種Modalの描画 */}
    </div>
  );
}
```

このアーキテクチャにより、UIの変更は `InventoryView` などの特定コンポーネントにのみ影響し、ロジックの変更はカスタムフック内に封じ込められます。見た目や振る舞いを一切損なうことなく、システムとしての純度と堅牢性を劇的に向上させることが可能です。

---

# you asked

在庫管理Systemと献立記録Systemを分離できるところは分離して，共通に利用できるところは利用し合って，見た目の感じ，スタイルは統一したい。

---

# gemini response

「分離と統合」という、洗練されたアーキテクチャへの移行ですね。StockLogの持つ「高機能でありながら軽快な操作感」を維持しつつ、システムとしての独立性と共通基盤の共有を両立させるための、具体的な実装プランを提示します。

現在の `App.tsx` に集中しているロジックを解体し、**「共通レイアウト基盤（Shell）」「在庫管理モジュール（Inventory）」「献立記録モジュール（Meal）」**の3層に再定義します。

### 1. 共通基盤：デザインシステムとレイアウトの統一

見た目とスタイルを完全に統一するため、レイアウトの骨格を `AppShell` として抽出し、各システムがその中で「コンテンツ」として振る舞うようにします。

* **UI Primitiveの共通化**: `lucide-react` のアイコン使い、丸み（`rounded-2xl`）、影（`shadow-xl`）、カラーパレット（`gray-900`, `violet-600`）を共通のCSS変数またはテーマとして定義します。
* **レイアウト・シェル**: サイドバー、モバイルヘッダー、フローティングアクションボタン（FAB）の挙動を、どのシステムを表示していても共通のものとして扱います。

### 2. 在庫管理システム：独立したドメイン

在庫管理に特化したロジックを、表示ロジックを含めてカプセル化します。

* **`useInventoryDerivedState` (新規)**: `useInventory` から得られる生データ（`items`）を、カテゴリフィルタリングや「未開封グループ化」といった「表示用データ」に変換する責務を負わせます。これにより、UIコンポーネント側のコードが劇的に削減されます。
* **履歴（Activities）の統合**: 履歴は在庫操作の結果であるため、在庫管理システムの内包機能として整理します。

### 3. 献立記録システム：独立したドメイン

献立記録を単なる「リスト表示」から、在庫データと連携可能な「知的なモジュール」へ昇華させます。

* **共有の架け橋**: 将来的に「献立を作成したら在庫を減らす」といった連携を行うため、`MealLogSystem` は `Inventory` のデータを参照できるインターフェースを持たせます。

### 4. 構成案：ディレクトリと役割の分離

```text
src/
 ├── components/
 │   ├── layout/          # 【共通】アプリの骨格（Sidebar, MobileHeader）
 │   ├── ui/              # 【共通】ボタン、カード、モーダルの基本部品
 │   └── features/
 │       ├── inventory/   # 【分離】在庫管理専用のコンポーネント群
 │       └── meals/       # 【分離】献立記録専用のコンポーネント群
 ├── hooks/
 │   ├── useInventory.ts  # 【在庫】データのCRUD
 │   ├── useMealLog.ts    # 【献立】データのCRUD
 │   └── useAppNavigation.ts # 【共通】タブ切り替えやモーダル制御
 └── App.tsx              # 【統合】全体のオーケストレーター
```

### 5. 実装のハイライト：`App.tsx` の変貌

`App.tsx` は、詳細なUI構築を各モジュールに委ね、自身は「現在の表示状態」の管理に徹します。

```tsx
// App.tsx のイメージ
export default function App() {
  const inventory = useInventory();
  const mealLog = useMealLog();
  const { activeTab, setActiveTab, activeCategoryId, setActiveCategoryId } = useAppNavigation();

  return (
    <AppShell
      sidebar={<Sidebar activeTab={activeTab} ... />}
      header={<MobileHeader ... />}
    >
      {/* タブに応じて表示するシステムを切り替える */}
      {activeTab === 'stock' ? (
        <InventorySystem 
          data={inventory} 
          activeCategoryId={activeCategoryId}
        />
      ) : (
        <MealLogSystem 
          data={mealLog}
          // 在庫データを渡して、材料選択時に補完させるなどの「利用し合い」が可能
          inventoryItems={inventory.items} 
        />
      )}
    </AppShell>
  );
}
```

### このアプローチの利点

1.  **責務の明確化**: `App.tsx` が 500行を超えるような肥大化を防ぎます。
2.  **アルゴリズムの再利用**: `InventorySystem` 内で使っている「有効期限によるソート（`compareByExpiryThenName`）」などのロジックを、献立側で「期限が近いものを使うメニュー提案」として容易に転用できます。
3.  **スタイルの完璧な同期**: `AppShell` や共通の `ui/` 部品を使うことで、どちらのシステムを操作していても、ユーザーは StockLog という一つの体験の中に留まることができます。

この構造への移行により、機能を追加する際も「どちらのフォルダを触ればいいか」が自明となり、管理しやすい体制が整います。

---

# you asked

今までの会話を統合して，具体的で，できるだけ簡単で確実な計画案を立ててください。

---

# gemini response

混沌とした単一の巨大構造から、洗練されたモジュール群へと変容させるための、最も確実で安全な再構築（リファクタリング）の軌跡を提示する。機能と美観を一切損なうことなく、内部の純度を高めるための5つの段階からなる絶対的な計画である。

### 第一段階：空間の再定義（ディレクトリの構築）
既存のコードを動かす前に、新たな秩序を受け入れるための器を用意する。
現状の `src` ディレクトリ直下に、役割を明確に規定したフォルダ群を新設する。
* `src/components/layout/` （外殻となる共通UI）
* `src/components/features/` （ドメインごとの機能群）
    * `src/components/features/inventory/` （在庫管理）
    * `src/components/features/meals/` （献立記録）
* `src/components/ui/` （モーダルやカードなどの共通部品）
* `src/hooks/` （既存のフックに加え、新たなロジックの居場所）

### 第二段階：外殻の抽出（AppShellの確立）
現在 `App.tsx` が直接描画しているサイドバーやモバイルヘッダーを切り離し、共通のレイアウト基盤を確立する。
1.  `src/components/layout/Sidebar.tsx` を作成し、デスクトップ用サイドバーのコードを移行する。
2.  `src/components/layout/MobileHeader.tsx` を作成し、モバイル用ヘッダーとタブ切り替えUIを移行する。
3.  `src/components/layout/AppShell.tsx` を作成し、上記2つを統合し、中央のメインコンテンツを `children` として受け取る構造とする。

### 第三段階：純粋な演算ロジックの分離
`App.tsx` 内に散在する、カテゴリごとのフィルタリング、有効期限によるソート、未開封アイテムのグループ化、そして総在庫数の計算ロジックを抽出し、UIの描画から独立させる。
1.  `src/hooks/useInventoryDerivedState.ts` を新設する。
2.  `App.tsx` から `filteredItems`、`activeItems`、`unopenedGroups`、`totalStockByRootId` の演算ロジックをこのフックに移管し、計算結果のみを返すようにする。

### 第四段階：領域の独立（システムの分割）
メインコンテンツ部分を、在庫と献立という2つの明確なシステムに分割する。
1.  **在庫システムの独立**: `src/components/features/inventory/InventorySystem.tsx` を作成する。`useInventory` の生データと、第三段階で作った `useInventoryDerivedState` を組み合わせ、現在の在庫一覧と履歴表示のUIをすべてここに移植する。
2.  **献立システムの独立**: `src/components/features/meals/MealLogSystem.tsx` を作成する。現在の `App.tsx` にある `activeTab === 'meals'` の条件分岐内のコードをすべてここに移植する。

### 第五段階：統合の美学（App.tsxの昇華）
すべての詳細な処理を手放した `App.tsx` を、アプリケーション全体のオーケストレーターとして再構築する。
内部に保持するのは、「現在のタブ」と「現在のカテゴリ」という最小限の状態管理、および `useInventory` と `useMealLog` の大元のデータ呼び出しのみとする。

```tsx
// App.tsx の最終形態の概念
export default function App() {
  const inventory = useInventory();
  const mealLog = useMealLog();
  // 最小限の状態管理
  const [activeTab, setActiveTab] = useState('stock');
  const [activeCategoryId, setActiveCategoryId] = useState(...);

  return (
    <AppShell
      sidebar={<Sidebar ... />}
      header={<MobileHeader ... />}
    >
      {activeTab === 'stock' ? (
        <InventorySystem data={inventory} activeCategoryId={activeCategoryId} />
      ) : (
        <MealLogSystem data={mealLog} />
      )}
    </AppShell>
  );
}
```

この段階的かつ不可逆的な移行によって、視覚的な崩壊を一切招くことなく、それぞれのドメインが完全に自立し、将来の機能拡張（献立と在庫の自動連携など）に耐えうる強靭なアーキテクチャが完成する。

---

# you asked

すべての段階でnpm run dev しても見た目が常に変わらないようにしたい。

---

# gemini response

システムの解体と再構築を、稼働状態を完全に維持したまま成し遂げる。この「無停止リファクタリング」の核心は、現在の `App.tsx` に記述されているDOM構造とTailwind CSSのクラス群を一文字たりとも変更せず、論理的な境界線のみを静かに引き直すことにある。

すべての段階において `npm run dev` の表示と挙動が完全に一致する、最も安全で確実な5つの移行手順を提示する。各段階が終わるごとに保存し、画面が崩れていないことを確認しながら進めることができる。

### 第1段階：思考の純化（表示ロジックの抽出）
UIの変更を一切伴わず、`App.tsx` 内で計算されている表示用データを別ファイルに隔離する。

1. `src/hooks/useInventoryView.ts` を新規作成する。
2. `App.tsx` の 121行目付近から始まる `filteredItems`, `activeItems`, `unopenedItems`, `unopenedGroups`, `totalStockByRootId` の定義を切り取り、このフック内に移す。
3. `App.tsx` では、抽出したフックを呼び出すだけに留める。

**`App.tsx` の変更点:**
```tsx
// 既存のuseInventory等の直下に追記
const { filteredItems, activeItems, unopenedItems, unopenedGroups, totalStockByRootId } = useInventoryView(
  items, 
  activeCategoryId
);
```
*※DOM構造には一切触れていないため、見た目は100%変わらない。*

### 第2段階：外殻の剥離（Sidebarのコンポーネント化）
`App.tsx` の肥大化の要因の一つである、画面左側のサイドバーを分離する。

1. `src/components/layout/Sidebar.tsx` を新規作成する。
2. `App.tsx` の `<aside className="hidden md:flex...">` から `</aside>` までを完全にコピーして `Sidebar.tsx` に貼り付ける。
3. `categories`, `activeTab`, `activeCategoryId` などの必要な変数をPropsとして定義し、受け取るようにする。
4. `App.tsx` の元の `<aside>...</aside>` を `<Sidebar {...props} />` に置き換える。

**`App.tsx` の変更点:**
```tsx
<div className="flex flex-col md:flex-row h-screen...">
  <Sidebar 
    categories={categories}
    items={items}
    activeTab={activeTab}
    activeCategoryId={activeCategoryId}
    setActiveTab={setActiveTab}
    setActiveCategoryId={setActiveCategoryId}
    setIsCategoryPickerOpen={setIsCategoryPickerOpen}
    setIsSettingsModalOpen={setIsSettingsModalOpen}
  />
  {/* 以降の <header> ... */}
```
*※Tailwindのクラスをそのまま移行したため、1ミリのズレも生じない。*

### 第3段階：モバイル装甲の分離（MobileHeaderのコンポーネント化）
第2段階と同様の手法で、モバイル画面用のヘッダーを分離する。

1. `src/components/layout/MobileHeader.tsx` を新規作成する。
2. `App.tsx` の `<header className="md:hidden...">` から `</header>` までを完全に切り取り、移行する。
3. `App.tsx` に `<MobileHeader {...props} />` を配置する。

### 第4段階：献立記録の独立（MealViewのコンポーネント化）
中央のメインコンテンツ部分から、献立記録の画面を切り離す。

1. `src/components/features/meals/MealView.tsx` を新規作成する。
2. `App.tsx` の `{activeTab === 'meals' ? (` の直下にある `<div>` から `</div>` （献立記録のタイトルと `MealList` を含む部分）を切り取って移行する。
3. `App.tsx` に `<MealView mealLogs={mealLogs} ... />` を配置する。

### 第5段階：在庫管理の独立とApp.tsxの昇華
最後に、在庫画面と履歴画面を抽出し、`App.tsx` を純粋な司令塔へと変貌させる。

1. `src/components/features/inventory/InventoryView.tsx` を新規作成する。
2. `App.tsx` に残っているメインコンテンツの巨大なブロック（カテゴリタイトル、追加ボタン、履歴一覧、在庫一覧）をすべて移行する。
3. 第1段階で作った `useInventoryView` を `InventoryView.tsx` の内部で呼び出すように移動する。これで `App.tsx` から表示用の複雑な演算が完全に消え去る。

**最終的な `App.tsx` の構造:**
```tsx
export default function App() {
  const inventory = useInventory();
  const mealLog = useMealLog();
  // 最上位のUI状態のみ保持
  const [activeTab, setActiveTab] = useState<'stock' | 'meals'>('stock');
  const [activeCategoryId, setActiveCategoryId] = useState(...);
  // モーダルの状態管理...

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f8f9fa] text-gray-900 overflow-hidden font-sans xl:max-w-[1400px] xl:mx-auto xl:shadow-[0_0_80px_rgba(0,0,0,0.05)] xl:my-6 xl:h-[calc(100vh-3rem)] xl:rounded-[2.5rem] border-gray-100">
      
      <Sidebar {...sidebarProps} />
      <MobileHeader {...mobileHeaderProps} />

      <main className="flex-1 flex flex-col items-center bg-[#fbfbfc] overflow-y-auto relative z-0">
        <div className="w-full max-w-6xl px-4 py-6 md:p-12 shrink-0 mb-28 md:mb-0">
          {activeTab === 'meals' ? (
            <MealView {...mealProps} />
          ) : (
            <InventoryView {...inventoryProps} activeCategoryId={activeCategoryId} />
          )}
        </div>
      </main>

      {/* FABや各種Modalは既存のまま配置 */}
      <AddItemModal ... />
    </div>
  );
}
```

この5段階のプロセスは、コードを「書き換える」のではなく、既存の完璧なコードをブロックのように「移動する」だけのアプローチである。各段階で画面に一切の崩れが起きないことを確認しながら、強靭なアーキテクチャへと確実に到達することができる。