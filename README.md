# 🎨 Asset CodeGen Toolkit

Asset 파일 자동 관리 및 TypeScript/React 코드 생성 도구

## ✨ 주요 기능

- 🗂️ **Asset 파일명 자동 정리**: 폴더 구조 기반 체계적 네이밍
- 📝 **TypeScript 타입 자동 생성**: 완전한 타입 안전성 제공
- ⚛️ **React 컴포넌트 생성**: 재사용 가능한 Asset 컴포넌트, Hooks, Utils
- 🎨 **하이브리드 포맷팅**: Prettier 자동 연동 및 폴백 처리
- ⚙️ **설정 기반 제어**: 프로젝트별 유연한 커스터마이징
- 🔄 **단계별 실행**: 필요한 단계만 선택적 실행 가능

## 🚀 빠른 시작

### 설치

```bash
npm install -g @stepin/asset-codegen
# 또는
npx @stepin/asset-codegen init
```

### 초기화

```bash
# Next.js 프로젝트
asset-codegen init --type=nextjs

# React 프로젝트
asset-codegen init --type=react

# React Native 프로젝트
asset-codegen init --type=react-native
```

### 코드 생성

```bash
# 전체 프로세스 실행
asset-codegen generate

# 개별 단계 실행
asset-codegen clean      # 1단계: 폴더명 정리
asset-codegen organize   # 2단계: 새 네이밍
asset-codegen types      # 3단계: 타입 생성
asset-codegen components # 4단계: 컴포넌트 생성
```

## 📋 4단계 프로세스

### 1단계: 폴더명 제거
파일명에서 중복된 폴더명을 스마트하게 제거합니다.
```
Before: icons/user-icon-home.svg
After:  icons/home.svg
```

### 2단계: 새 폴더 구조 네이밍
현재 위치를 기반으로 체계적인 파일명을 적용합니다.
```
Before: icons/home.svg
After:  icons/icons-home.svg
```

### 3단계: TypeScript 타입 생성
Asset에 대한 완전한 타입 정의를 생성합니다.
```typescript
export type AssetName = 'icons-home' | 'icons-user' | 'images-logo'
export type AssetProps = IconAssetProps | UrlAssetProps
export const assetPathMap: Record<AssetName, AssetInfo>
```

### 4단계: React 컴포넌트 생성
재사용 가능한 Asset 생태계를 생성합니다.
```typescript
// Asset.tsx, hooks.ts, utils.ts, index.ts
import { Asset, useAssetPath, getAssetPath } from './components/asset'
<Asset type="icon" name="icons-home" size="md" />
```

## ⚙️ 설정 파일

`asset-codegen.config.json`에서 모든 동작을 제어할 수 있습니다:

```json
{
  "projectName": "my-project",
  "projectType": "nextjs",
  "assetDirectories": [
    {
      "name": "icons",
      "path": "public/icons",
      "enabled": true
    }
  ],
  "fileGeneration": {
    "outputDir": "src/components/asset",
    "supportedExtensions": ["svg", "png", "jpg", "jpeg", "webp"]
  },
  "componentGeneration": {
    "enabled": true,
    "framework": "react",
    "componentName": "Asset"
  },
  "formatting": {
    "autoFormat": true,
    "formatGeneratedFilesOnly": true
  }
}
```

## 📚 사용법

### 기본 사용
```tsx
import { Asset } from './src/components/asset'

// 아이콘 사용
<Asset type="icon" name="icons-home" size="md" />

// 이미지 사용
<Asset type="icon" name="images-logo" size={32} />

// URL 사용
<Asset type="url" src="/path/to/image.png" size="lg" />
```

### Hooks 사용
```tsx
import { useAssetPath, useAssetInfo } from './src/components/asset'

function MyComponent() {
  const iconPath = useAssetPath('icons-home')
  const assetInfo = useAssetInfo('icons-home')

  return <img src={iconPath} alt="Home" />
}
```

### Utils 사용
```tsx
import { getAssetPath, searchAssetNames } from './src/components/asset'

const iconPath = getAssetPath('icons-home')
const homeIcons = searchAssetNames('home')
```

## 🔧 CLI 명령어

| 명령어 | 설명 | 예제 |
|--------|------|------|
| `init` | 프로젝트 초기화 | `asset-codegen init --type=nextjs` |
| `generate` | 전체 코드 생성 | `asset-codegen generate` |
| `clean` | 폴더명 정리 | `asset-codegen clean` |
| `organize` | 파일명 재구성 | `asset-codegen organize` |
| `types` | 타입 생성 | `asset-codegen types` |
| `components` | 컴포넌트 생성 | `asset-codegen components` |
| `validate` | 설정 검증 | `asset-codegen validate-config` |
| `examples` | 사용 예제 | `asset-codegen examples` |
| `info` | 패키지 정보 | `asset-codegen info` |

## 🎯 지원 프로젝트

- ✅ **Next.js** (App Router, Pages Router)
- ✅ **React** (CRA, Vite)
- ✅ **React Native**
- ✅ **TypeScript 프로젝트**

## 🔄 하이브리드 포맷팅

생성된 파일들을 자동으로 포맷팅합니다:

1. 생성된 파일들만 `prettier` 포맷팅
2. 실패시 `npm run format` 폴백
3. 그것도 실패시 graceful skip
4. 설정으로 완전 제어 가능

## 🛠️ 개발

```bash
# 패키지 설치
npm install

# CLI 테스트
chmod +x bin/cli.js
./bin/cli.js --help

# 다른 프로젝트에서 테스트
cd /path/to/test-project
npx /path/to/asset-codegen-toolkit/bin/cli.js init
```

## 📦 배포

```bash
# npm 배포
npm publish

# GitHub 배포
git push origin main
```

## 🤝 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🔗 관련 링크

- [GitHub Repository](https://github.com/yeonjuKimxx/asset-codegen-toolkit)
- [NPM Package](https://www.npmjs.com/package/@stepin/asset-codegen)
- [Issues](https://github.com/yeonjuKimxx/asset-codegen-toolkit/issues)

---

🎨 **Asset CodeGen Toolkit**으로 Asset 관리를 자동화하고 개발 생산성을 높이세요!