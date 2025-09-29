/**
 * ⚛️ React 컴포넌트 생성기
 *
 * Asset을 위한 완전한 React 생태계를 생성합니다
 * - Asset 컴포넌트 (discriminated union props)
 * - Custom Hooks (useAssetPath, useAssetInfo 등)
 * - Utility 함수들
 * - 통합 index 파일
 */

import { promises as fs } from 'fs'
import { join } from 'path'
import chalk from 'chalk'

export class ComponentsGenerator {
	constructor(config) {
		this.config = config
	}

	/**
	 * 파일 덮어쓰기 처리
	 * @param {string} filepath - 파일 경로
	 * @param {string} filename - 파일명
	 * @returns {boolean} - true이면 스킵, false이면 계속 진행
	 */
	async handleFileOverwrite(filepath, filename) {
		try {
			await fs.access(filepath)
			// 파일이 존재함

			const overwriteMode = this.config.componentGeneration?.overwriteMode || 'overwrite'

			switch (overwriteMode) {
				case 'skip':
					console.log(chalk.yellow(`  ⚠️ ${filename} 파일이 이미 존재합니다. 건너뜁니다.`))
					return true

				case 'backup':
					const backupPath = `${filepath}.backup`
					await fs.copyFile(filepath, backupPath)
					console.log(chalk.blue(`  📦 ${filename} 백업 생성: ${filename}.backup`))
					return false

				case 'overwrite':
				default:
					console.log(chalk.blue(`  🔄 ${filename} 파일을 덮어씁니다.`))
					return false
			}
		} catch (error) {
			// 파일이 존재하지 않음 - 정상 진행
			return false
		}
	}

	/**
	 * React 컴포넌트 생성 프로세스 실행
	 */
	async generate() {
		console.log(chalk.blue('⚛️ 4단계: React 컴포넌트 생성 시작...'))

		if (!this.config.componentGeneration?.enabled) {
			console.log(chalk.yellow('⚠️ 컴포넌트 생성이 비활성화되어 있습니다.'))
			return []
		}

		const outputDir = this.config.fileGeneration.outputDir
		const framework = this.config.componentGeneration.framework || 'react'

		// 디렉토리 생성
		await fs.mkdir(outputDir, { recursive: true })

		const generatedFiles = []

		// 1. Asset 컴포넌트 생성
		const componentFile = await this.generateAssetComponent(outputDir, framework)
		generatedFiles.push(componentFile)

		// 2. Hooks 생성 (옵션)
		if (this.config.componentGeneration.generateHook) {
			const hooksFile = await this.generateHooks(outputDir)
			generatedFiles.push(hooksFile)
		}

		// 3. Utils 생성 (옵션)
		if (this.config.componentGeneration.generateUtils) {
			const utilsFile = await this.generateUtils(outputDir)
			generatedFiles.push(utilsFile)
		}

		// 4. Index 파일 생성
		const indexFile = await this.generateIndex(outputDir)
		generatedFiles.push(indexFile)

		console.log(chalk.green(`✅ 4단계 완료: React 컴포넌트 생성됨 (${generatedFiles.length}개 파일)`))
		return generatedFiles
	}

	/**
	 * Asset 컴포넌트 생성
	 */
	async generateAssetComponent(outputDir, framework) {
		const componentName = this.config.componentGeneration.componentName || 'Asset'
		const filename = `${componentName}.tsx`
		const filepath = join(outputDir, filename)

		// 파일 존재 여부 확인 및 처리
		const shouldSkip = await this.handleFileOverwrite(filepath, filename)
		if (shouldSkip) {
			return filepath
		}

		let componentCode
		switch (framework) {
			case 'react-native':
				componentCode = this.generateReactNativeComponent(componentName)
				break
			case 'react':
			default:
				componentCode = this.generateReactComponent(componentName)
				break
		}

		await fs.writeFile(filepath, componentCode, 'utf8')
		console.log(chalk.green(`  ✓ Asset 컴포넌트 생성: ${filename}`))

		return filepath
	}

	/**
	 * React 컴포넌트 코드 생성
	 */
	generateReactComponent(componentName) {
		const { assetNameType, assetPropsType } = this.config.typeGeneration

		return `/**
 * 🎨 Asset 컴포넌트
 *
 * Asset CodeGen에 의해 자동 생성된 React 컴포넌트
 * 모든 Asset을 type-safe하게 사용할 수 있습니다
 */

import React from 'react'
import Image from 'next/image'
import { ${assetPropsType}, ${assetNameType}, SizeType, ColorType, assetPathMap, sizeMapping, colorMapping } from './types'

/**
 * Asset을 렌더링하는 메인 컴포넌트
 */
export default function ${componentName}(props: ${assetPropsType}) {
  // 공통 size 계산
  const calculatedSize = calculateSize(props.size)

  if (props.type === 'icon') {
    return renderIcon(props, calculatedSize)
  } else if (props.type === 'image') {
    return renderImage(props, calculatedSize)
  } else {
    return renderUrl(props, calculatedSize)
  }
}

/**
 * 아이콘 렌더링
 */
function renderIcon(props: Extract<${assetPropsType}, { type: 'icon' }>, size: number) {
  const assetInfo = assetPathMap[props.name]
  const iconPath = \`/\${assetInfo.path}\`

  // SVG 아이콘인 경우
  if (assetInfo.extension === 'svg') {
    return (
      <svg
        width={size}
        height={size}
        className={props.className}
        style={{
          fill: calculateColor(props.color),
          ...props.style,
        }}
      >
        <use href={\`\${iconPath}#icon\`} />
      </svg>
    )
  }

  // 이미지 아이콘인 경우
  return (
    <Image
      src={iconPath}
      alt={props.name}
      width={size}
      height={size}
      className={props.className}
      style={props.style}
    />
  )
}

/**
 * 이미지 렌더링
 */
function renderImage(props: Extract<${assetPropsType}, { type: 'image' }>, size: number) {
  const assetInfo = assetPathMap[props.name]
  const imagePath = \`/\${assetInfo.path}\`

  return (
    <Image
      src={imagePath}
      alt={props.alt || props.name}
      width={size}
      height={size}
      className={props.className}
      style={props.style}
    />
  )
}

/**
 * URL 기반 이미지 렌더링
 */
function renderUrl(props: Extract<${assetPropsType}, { type: 'url' }>, size: number) {
  return (
    <Image
      src={props.src}
      alt={props.alt || 'Image'}
      width={size}
      height={size}
      className={props.className}
      style={props.style}
    />
  )
}

/**
 * Size 계산 유틸리티
 */
function calculateSize(size?: SizeType | number): number {
  if (typeof size === 'number') {
    return size
  }

  if (typeof size === 'string' && size in sizeMapping) {
    return sizeMapping[size as SizeType]
  }

  return sizeMapping.md || 24 // 기본값
}

/**
 * Color 계산 유틸리티
 */
function calculateColor(color?: ColorType | string): string | undefined {
  if (!color) return undefined

  if (typeof color === 'string' && color in colorMapping) {
    return colorMapping[color as ColorType]
  }

  return color
}`
	}

	/**
	 * React Native 컴포넌트 코드 생성
	 */
	generateReactNativeComponent(componentName) {
		const { assetNameType, assetPropsType } = this.config.typeGeneration

		return `/**
 * 🎨 Asset 컴포넌트 (React Native)
 *
 * Asset CodeGen에 의해 자동 생성된 React Native 컴포넌트
 * 모든 Asset을 type-safe하게 사용할 수 있습니다
 */

import React from 'react'
import { Image, ImageStyle, StyleProp } from 'react-native'
import { ${assetPropsType}, ${assetNameType}, SizeType, ColorType, assetPathMap, sizeMapping, colorMapping } from './types'

/**
 * Asset을 렌더링하는 메인 컴포넌트
 */
export default function ${componentName}(props: ${assetPropsType}) {
  // 공통 size 계산
  const calculatedSize = calculateSize(props.size)

  if (props.type === 'icon') {
    return renderIcon(props, calculatedSize)
  } else if (props.type === 'image') {
    return renderImage(props, calculatedSize)
  } else {
    return renderUrl(props, calculatedSize)
  }
}

/**
 * 아이콘 렌더링
 */
function renderIcon(props: Extract<${assetPropsType}, { type: 'icon' }>, size: number) {
  const assetInfo = assetPathMap[props.name]

  const source = { uri: assetInfo.path }

  const style: StyleProp<ImageStyle> = [
    {
      width: size,
      height: size,
      tintColor: calculateColor(props.color),
    },
    props.style,
  ]

  return <Image source={source} style={style} />
}

/**
 * 이미지 렌더링
 */
function renderImage(props: Extract<${assetPropsType}, { type: 'image' }>, size: number) {
  const assetInfo = assetPathMap[props.name]
  const source = { uri: assetInfo.path }

  const style: StyleProp<ImageStyle> = [
    {
      width: size,
      height: size,
    },
    props.style,
  ]

  return <Image source={source} style={style} />
}

/**
 * URL 기반 이미지 렌더링
 */
function renderUrl(props: Extract<${assetPropsType}, { type: 'url' }>, size: number) {
  const source = { uri: props.src }

  const style: StyleProp<ImageStyle> = [
    {
      width: size,
      height: size,
    },
    props.style,
  ]

  return <Image source={source} style={style} />
}

/**
 * Size 계산 유틸리티
 */
function calculateSize(size?: SizeType | number): number {
  if (typeof size === 'number') {
    return size
  }

  if (typeof size === 'string' && size in sizeMapping) {
    return sizeMapping[size as SizeType]
  }

  return sizeMapping.md || 24 // 기본값
}

/**
 * Color 계산 유틸리티
 */
function calculateColor(color?: ColorType | string): string | undefined {
  if (!color) return undefined

  if (typeof color === 'string' && color in colorMapping) {
    return colorMapping[color as ColorType]
  }

  return color
}`
	}

	/**
	 * Hooks 파일 생성
	 */
	async generateHooks(outputDir) {
		const filename = 'hooks.ts'
		const filepath = join(outputDir, filename)

		// 파일 존재 여부 확인 및 처리
		const shouldSkip = await this.handleFileOverwrite(filepath, filename)
		if (shouldSkip) {
			return filepath
		}

		const hooksCode = this.generateHooksCode()

		await fs.writeFile(filepath, hooksCode, 'utf8')
		console.log(chalk.green(`  ✓ Hooks 파일 생성: ${filename}`))

		return filepath
	}

	/**
	 * Hooks 코드 생성
	 */
	generateHooksCode() {
		const { assetNameType } = this.config.typeGeneration

		return `/**
 * 🪝 Asset Hooks
 *
 * Asset CodeGen에 의해 자동 생성된 React Hooks
 */

import { useMemo } from 'react'
import { ${assetNameType}, AssetInfo, assetPathMap } from './types'

/**
 * Asset 경로를 가져오는 Hook
 */
export function useAssetPath(name: ${assetNameType}): string {
  return useMemo(() => {
    const assetInfo = assetPathMap[name]
    return \`/\${assetInfo.path}\`
  }, [name])
}

/**
 * 여러 Asset 경로를 가져오는 Hook
 */
export function useAssetPaths(names: ${assetNameType}[]): string[] {
  return useMemo(() => {
    return names.map(name => {
      const assetInfo = assetPathMap[name]
      return \`/\${assetInfo.path}\`
    })
  }, [names])
}

/**
 * Asset 정보를 가져오는 Hook
 */
export function useAssetInfo(name: ${assetNameType}): AssetInfo {
  return useMemo(() => assetPathMap[name], [name])
}

/**
 * Asset 정보 배열을 가져오는 Hook
 */
export function useAssetInfos(names: ${assetNameType}[]): AssetInfo[] {
  return useMemo(() => {
    return names.map(name => assetPathMap[name])
  }, [names])
}

/**
 * 타입별 Asset 이름들을 필터링하는 Hook
 */
export function useAssetNamesByType(type: 'icon' | 'image' | 'asset'): ${assetNameType}[] {
  return useMemo(() => {
    return Object.values(assetPathMap)
      .filter(asset => asset.type === type)
      .map(asset => asset.name as ${assetNameType})
  }, [type])
}

/**
 * 카테고리별 Asset 이름들을 필터링하는 Hook
 */
export function useAssetNamesByCategory(category: string): ${assetNameType}[] {
  return useMemo(() => {
    return Object.values(assetPathMap)
      .filter(asset => asset.category === category)
      .map(asset => asset.name as ${assetNameType})
  }, [category])
}

/**
 * Asset 검색 Hook
 */
export function useSearchAssetNames(searchTerm: string): ${assetNameType}[] {
  return useMemo(() => {
    if (!searchTerm.trim()) return []

    const term = searchTerm.toLowerCase()
    return Object.values(assetPathMap)
      .filter(asset =>
        asset.name.toLowerCase().includes(term) ||
        asset.filename.toLowerCase().includes(term) ||
        asset.category.toLowerCase().includes(term)
      )
      .map(asset => asset.name as ${assetNameType})
  }, [searchTerm])
}`
	}

	/**
	 * Utils 파일 생성
	 */
	async generateUtils(outputDir) {
		const filename = 'utils.ts'
		const filepath = join(outputDir, filename)

		// 파일 존재 여부 확인 및 처리
		const shouldSkip = await this.handleFileOverwrite(filepath, filename)
		if (shouldSkip) {
			return filepath
		}

		const utilsCode = this.generateUtilsCode()

		await fs.writeFile(filepath, utilsCode, 'utf8')
		console.log(chalk.green(`  ✓ Utils 파일 생성: ${filename}`))

		return filepath
	}

	/**
	 * Utils 코드 생성
	 */
	generateUtilsCode() {
		const { assetNameType } = this.config.typeGeneration

		return `/**
 * 🛠️ Asset Utilities
 *
 * Asset CodeGen에 의해 자동 생성된 유틸리티 함수들
 */

import { ${assetNameType}, AssetInfo, SizeType, ColorType, assetPathMap, sizeMapping, colorMapping } from './types'

/**
 * Asset 경로 가져오기
 */
export function getAssetPath(name: ${assetNameType}): string {
  const assetInfo = assetPathMap[name]
  return \`/\${assetInfo.path}\`
}

/**
 * Asset 정보 가져오기
 */
export function getAssetInfo(name: ${assetNameType}): AssetInfo {
  return assetPathMap[name]
}

/**
 * Size 값 계산
 */
export function calculateSize(size?: SizeType | number): number {
  if (typeof size === 'number') {
    return size
  }

  if (typeof size === 'string' && size in sizeMapping) {
    return sizeMapping[size as SizeType]
  }

  return sizeMapping.md || 24 // 기본값
}

/**
 * Color 값 계산
 */
export function calculateColor(color?: ColorType | string): string | undefined {
  if (!color) return undefined

  if (typeof color === 'string' && color in colorMapping) {
    return colorMapping[color as ColorType]
  }

  return color
}

/**
 * Asset 이름들 검색
 */
export function searchAssetNames(searchTerm: string): ${assetNameType}[] {
  if (!searchTerm.trim()) return []

  const term = searchTerm.toLowerCase()
  return Object.values(assetPathMap)
    .filter(asset =>
      asset.name.toLowerCase().includes(term) ||
      asset.filename.toLowerCase().includes(term) ||
      asset.category.toLowerCase().includes(term)
    )
    .map(asset => asset.name as ${assetNameType})
}

/**
 * 타입별 Asset 이름들 필터링
 */
export function getAssetNamesByType(type: 'icon' | 'image' | 'asset'): ${assetNameType}[] {
  return Object.values(assetPathMap)
    .filter(asset => asset.type === type)
    .map(asset => asset.name as ${assetNameType})
}

/**
 * 카테고리별 Asset 이름들 필터링
 */
export function getAssetNamesByCategory(category: string): ${assetNameType}[] {
  return Object.values(assetPathMap)
    .filter(asset => asset.category === category)
    .map(asset => asset.name as ${assetNameType})
}

/**
 * Asset 존재 여부 확인
 */
export function hasAsset(name: string): name is ${assetNameType} {
  return name in assetPathMap
}

/**
 * 모든 Asset 이름 가져오기
 */
export function getAllAssetNames(): ${assetNameType}[] {
  return Object.keys(assetPathMap) as ${assetNameType}[]
}

/**
 * Asset 통계 정보
 */
export function getAssetStats() {
  const assets = Object.values(assetPathMap)

  const byType = assets.reduce((acc, asset) => {
    acc[asset.type] = (acc[asset.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const byCategory = assets.reduce((acc, asset) => {
    acc[asset.category] = (acc[asset.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const byExtension = assets.reduce((acc, asset) => {
    acc[asset.extension] = (acc[asset.extension] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    total: assets.length,
    byType,
    byCategory,
    byExtension,
  }
}`
	}

	/**
	 * Index 파일 생성
	 */
	async generateIndex(outputDir) {
		const filename = 'index.ts'
		const filepath = join(outputDir, filename)

		// 파일 존재 여부 확인 및 처리
		const shouldSkip = await this.handleFileOverwrite(filepath, filename)
		if (shouldSkip) {
			return filepath
		}

		const indexCode = this.generateIndexCode()

		await fs.writeFile(filepath, indexCode, 'utf8')
		console.log(chalk.green(`  ✓ Index 파일 생성: ${filename}`))

		return filepath
	}

	/**
	 * Index 코드 생성
	 */
	generateIndexCode() {
		const componentName = this.config.componentGeneration.componentName || 'Asset'
		const generateHook = this.config.componentGeneration.generateHook
		const generateUtils = this.config.componentGeneration.generateUtils

		const exports = []

		// 1. 컴포넌트 export
		exports.push(`// Asset 컴포넌트`)
		exports.push(`export { default as ${componentName} } from './${componentName}'`)

		// 2. 타입들 export
		exports.push(`\n// 타입 정의`)
		exports.push(`export * from './types'`)

		// 3. Hooks export (옵션)
		if (generateHook) {
			exports.push(`\n// Hooks`)
			exports.push(`export * from './hooks'`)
		}

		// 4. Utils export (옵션)
		if (generateUtils) {
			exports.push(`\n// Utilities`)
			exports.push(`export * from './utils'`)
		}

		return `/**
 * 🎨 Asset 모듈
 *
 * Asset CodeGen에 의해 자동 생성된 통합 export 파일
 */

${exports.join('\n')}
`
	}
}