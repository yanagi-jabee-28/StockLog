# StockLog Architecture Guide

本プロジェクトは **Feature-Sliced Design (FSD)** の思想に基づき、責務ごとに階層を分離しています。
これにより、UI、ビジネスロジック、データ永続化層の「癒着」を防ぎ、長期的なメンテナンス性を確保します。

## 階層構造の定義

FSDでは、下位レイヤーは上位レイヤーを参照してはいけません（単方向依存）。

| レイヤー | 役割 | 依存関係 |
| :--- | :--- | :--- |
| **1. app** | アプリケーションのエントリーポイント、Provider設定、グローバルスタイル | すべてを参照 |
| **2. features** | ユーザーが実行する具体的な「アクション」。AddItemやLogMealなど | entities, shared |
| **3. entities** | ドメイン概念（Inventory, Meal）。データ構造、リポジトリ、ドメイン固有UI | shared |
| **4. shared** | プロジェクト全体で再利用される汎用コード。lib, types, constants | 依存なし |

---

## 詳細なディレクトリ構成

```text
src/
├── app/                  # アプリケーション全体の基盤
│   ├── providers/        # Context Providers (DataProvider, UIProvider)
│   └── styles/           # グローバルスタイル (index.css)
├── features/             # アプリケーションの機能単位 (Actions)
│   ├── add-item/         # 在庫追加機能
│   │   ├── lib/          # 機能固有フック (useAddItemForm)
│   │   └── ui/           # 機能固有UI (AddItemModal)
│   ├── log-meal/         # 献立記録機能
│   └── ai-selection/     # AIコピー用の選択機能
├── entities/             # ビジネスドメイン (Domain Data)
│   ├── inventory/        # 在庫ドメイン (Items, Activities)
│   │   ├── api/          # Repository実装
│   │   ├── lib/          # ドメイン固有フック (useInventory)
│   │   ├── model/        # ロジック・同期処理
│   │   └── ui/           # ドメイン固有UI (ItemCard)
│   └── meal/             # 食事ドメイン (MealLogs)
├── shared/               # 汎用部品 (Infrastructure)
│   ├── lib/              # 汎用ロジック (storage, logger)
│   │   └── hooks/        # 汎用フック (useModalNavigation)
│   ├── ui/               # 汎用コンポーネント
│   │   └── layout/       # 基本レイアウト部品 (Sidebar, Header)
│   └── types.ts          # 共通型定義
└── constants.ts          # プロジェクト定数
```

## ファイル・ディレクトリ命名に関する方針

### 1. 同名フォルダの許容
各スライスの内部に `ui`, `model`, `lib`, `api` といった同名のディレクトリが並びますが、これは「どのドメインに属する部品か」を明確にするためです。

- ✅ `src/entities/inventory/ui/`
- ✅ `src/features/add-item/ui/`

### 2. 同名ファイルの回避と明確化
以前は `src/hooks/` にすべてのロジックが混在していましたが、現在は関連するドメインや機能の `lib` ディレクトリへ移動しました。
ファイル名から「何のための部品か」が判別しにくい場合は、ドメイン名をプレフィックスとして付与しています。

| 以前の状態 (混在) | 現在の状態 (分離) | 意図 |
| :--- | :--- | :--- |
| `src/hooks/useInventory.ts` | `src/entities/inventory/lib/useInventory.ts` | 在庫ドメインに属することを明示 |
| `src/hooks/useAddItemForm.ts` | `src/features/add-item/lib/useAddItemForm.ts` | 追加機能専用であることを明示 |

### 3. モジュール間の参照ルール
- **上位から下位への参照**: `features` は `entities` を参照できますが、その逆は禁止です。
- **共有部品の利用**: すべてのレイヤーは `shared` を参照できます。
- **クロス参照の禁止**: `entities/inventory` が `entities/meal` を直接参照することは避け、必要なら `app` レイヤーや `shared` を介して連携します。

これにより、ファイル名が似ていても「どのフォルダに入っているか」がそのままそのファイルの「役割と権限」を表すようになっています。
