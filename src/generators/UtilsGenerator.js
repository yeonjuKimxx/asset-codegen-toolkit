/**
 * 🛠️ Utils 생성기
 *
 * Asset을 위한 유틸리티 함수들을 생성합니다
 */

import { promises as fs } from 'fs'
import { join } from 'path'
import chalk from 'chalk'

export class UtilsGenerator {
	constructor(config) {
		this.config = config
	}

	/**
	 * Utils 파일 생성
	 */
	async generate(outputDir) {
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
		const assetDirectories = this.config.assetDirectories || []

		// assetDir별 basePath 매핑 생성 코드
		const basePathMapCode = assetDirectories.map(dir => {
			const pathWithoutPublic = dir.path.replace(/^public\//, '')
			const parts = pathWithoutPublic.split('/').slice(0, -1)
			const basePath = parts.length > 0 ? `/${parts.join('/')}` : ''
			return `assetDirBasePathMap.set('${dir.name}', '${basePath}')`
		}).join('\n    ')

		return `/**
 * 🛠️ Asset Utilities
 *
 * Asset CodeGen에 의해 자동 생성된 유틸리티 함수들
 */

import React from 'react'
import { AssetInfo, ${assetNameType}, AssetSize, AssetColor, assetPathMap, sizeMap, colorMap } from './types'

// assetDir별 basePath 매핑 생성
const assetDirBasePathMap = new Map<string, string>()
${basePathMapCode}

/**
 * Asset 경로 가져오기
 */
export function getAssetPath(name: ${assetNameType}): string {
    const assetInfo = assetPathMap[name]
    if (!assetInfo) {
        console.warn(\`Asset "\${name}" not found in assetPathMap\`)
        return ''
    }
    const basePath = assetDirBasePathMap.get(assetInfo.assetDir) || ''
    return \`\${basePath}/\${assetInfo.assetDir}/\${assetInfo.path}\`
}

/**
 * Asset 정보 가져오기
 */
export function getAssetInfo(name: ${assetNameType}): AssetInfo | null {
    return assetPathMap[name] || null
}

/**
 * 사이즈 스타일을 계산하는 유틸리티 함수
 */
export function getSizeStyle(size?: AssetSize, ratio?: number, style?: React.CSSProperties): React.CSSProperties {
    // size prop이 명시적으로 없거나 undefined인 경우
    if (size === undefined) {
        // ratio가 1이고 CSS에서 width나 height가 지정된 경우, 정사각형으로 만들기
        if (ratio === 1) {
            if (style?.width) {
                return { height: style.width }
            }
            if (style?.height) {
                return { width: style.height }
            }
        }
        return {}
    }

    if (typeof size === 'object' && size) {
        if ('width' in size && 'height' in size) {
            // 둘 다 지정된 경우 - 정확한 크기
            return {
                width: size.width,
                height: size.height,
            }
        }
        if ('width' in size && !('height' in size)) {
            // width만 지정 - ratio가 1이면 무조건 정사각형
            if (ratio === 1) {
                return {
                    width: size.width,
                    height: size.width,
                }
            }
            return {
                width: size.width,
                height: 'auto',
            }
        }
        if ('height' in size && !('width' in size)) {
            // height만 지정 - ratio가 1이면 무조건 정사각형
            if (ratio === 1) {
                return {
                    width: size.height,
                    height: size.height,
                }
            }
            return {
                width: 'auto',
                height: size.height,
            }
        }
    }

    // 기본 케이스 (문자열 사이즈나 숫자)
    const actualSize = typeof size === 'number' ? size :
                      (typeof size === 'string' && size in sizeMap) ? sizeMap[size as keyof typeof sizeMap] : sizeMap.md
    return {
        width: actualSize,
        height: actualSize,
    }
}

/**
 * 색상 값을 반환하는 유틸리티 함수
 */
export function getAssetColor(color?: AssetColor): string | undefined {
    if (!color) return undefined
    if (typeof color === 'string' && color in colorMap) {
        return colorMap[color as keyof typeof colorMap]
    }
    return color
}

/**
 * 최종 스타일을 조합하는 유틸리티 함수
 */
export function createCommonStyle(
    sizeStyle: React.CSSProperties,
    color: string | undefined,
    style?: React.CSSProperties
): React.CSSProperties {
    return {
        ...sizeStyle,
        color,
        ...style,
    }
}

/**
 * 에러/미발견 UI 엘리먼트를 생성하는 유틸리티 함수
 */
export function createErrorElement(
    type: 'error' | 'not-found',
    sizeStyle: React.CSSProperties,
    className: string = '',
    style?: React.CSSProperties,
    name?: string
): React.ReactElement {
    const isError = type === 'error'

    return React.createElement('div', {
        className: \`asset-\${type} \${className}\`,
        style: {
            ...sizeStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8f9fa',
            border: isError ? '1px solid #e9ecef' : '1px dashed #dee2e6',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#6c757d',
            ...style,
        }
    }, isError ? '❌' : \`❓ \${name || ''}\`)
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
}`
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
}