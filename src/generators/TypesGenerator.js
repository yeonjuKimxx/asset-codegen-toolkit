/**
 * 📝 TypeScript 타입 생성기
 *
 * Asset 파일들을 기반으로 완전한 TypeScript 타입 정의를 생성합니다
 */

import { promises as fs } from 'fs';
import { join, dirname, basename, extname, relative } from 'path';
import chalk from 'chalk';

export class TypesGenerator {
  constructor(config) {
    this.config = config;
  }

  /**
   * TypeScript 타입 생성 프로세스 실행
   */
  async generate() {
    console.log(chalk.blue('📝 3단계: TypeScript 타입 생성 시작...'));

    const enabledDirectories = this.config.assetDirectories.filter(
      (dir) => dir.enabled
    );

    if (enabledDirectories.length === 0) {
      console.log(chalk.yellow('⚠️ 활성화된 Asset 디렉토리가 없습니다.'));
      return [];
    }

    // 1. Asset 파일 정보 수집
    const assetInfo = await this.collectAssetInfo(enabledDirectories);

    // 2. TypeScript 타입 생성
    const typeDefinitions = this.generateTypeDefinitions(assetInfo);

    // 3. 파일 출력
    const outputPath = await this.writeTypeFile(typeDefinitions);

    console.log(
      chalk.green(
        `✅ 3단계 완료: TypeScript 타입 파일 생성됨 (${assetInfo.length}개 Asset)`
      )
    );
    return [outputPath];
  }

  /**
   * Asset 파일 정보 수집
   */
  async collectAssetInfo(assetDirectories) {
    const assetInfo = [];

    for (const assetDir of assetDirectories) {
      const dirAssets = await this.collectAssetsFromDirectory(assetDir);
      assetInfo.push(...dirAssets);
    }

    return assetInfo;
  }

  /**
   * 특정 디렉토리에서 Asset 정보 수집
   */
  async collectAssetsFromDirectory(assetDir) {
    const assets = [];

    try {
      await this.collectAssetsRecursive(assetDir.path, assetDir, assets);
    } catch (error) {
      console.warn(
        chalk.yellow(
          `⚠️ 디렉토리 스캔 실패: ${assetDir.path} - ${error.message}`
        )
      );
    }

    return assets;
  }

  /**
   * 재귀적으로 Asset 수집
   */
  async collectAssetsRecursive(dirPath, assetDir, assets) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        if (entry.isDirectory()) {
          await this.collectAssetsRecursive(fullPath, assetDir, assets);
        } else if (this.isAssetFile(entry.name)) {
          const assetInfo = this.createAssetInfo(fullPath, assetDir);
          assets.push(assetInfo);
        }
      }
    } catch (error) {
      console.warn(
        chalk.yellow(`⚠️ 디렉토리 읽기 실패: ${dirPath} - ${error.message}`)
      );
    }
  }

  /**
   * Asset 파일인지 확인
   */
  isAssetFile(filename) {
    const ext = extname(filename).toLowerCase().slice(1);
    return this.config.fileGeneration.supportedExtensions.includes(ext);
  }

  /**
   * Asset 정보 객체 생성
   */
  createAssetInfo(filePath, assetDir) {
    const filename = basename(filePath);
    const nameWithoutExt = basename(filename, extname(filename));
    const extension = extname(filename).toLowerCase().slice(1);
    const relativePath = relative(assetDir.path, filePath);
    const directory = dirname(relativePath);
    const pathParts =
      directory === '.' ? [] : directory.split('/').filter((part) => part);

    return {
      name: nameWithoutExt,
      filename,
      path: relativePath,
      fullPath: filePath,
      extension,
      assetDir: assetDir.name,
      pathParts,
      type: this.getAssetType(extension),
      category: this.getAssetCategory(nameWithoutExt, pathParts, assetDir.name),
    };
  }

  /**
   * Asset 타입 결정
   */
  getAssetType(extension) {
    const svgExtensions = ['svg'];
    const imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'];

    if (svgExtensions.includes(extension)) {
      return 'icon';
    } else if (imageExtensions.includes(extension)) {
      return 'image';
    } else {
      return 'asset';
    }
  }

  /**
   * Asset 카테고리 결정
   */
  getAssetCategory(name, pathParts, assetDirName) {
    // 경로 기반 카테고리 결정
    if (pathParts.length > 0) {
      return pathParts[0];
    }

    // Asset 디렉토리명 기반
    return assetDirName;
  }

  /**
   * TypeScript 타입 정의 생성
   */
  generateTypeDefinitions(assetInfo) {
    const { assetNameType, assetPropsType, pathMapName } =
      this.config.typeGeneration;

    const sections = [];

    // 1. Asset Names Union Type
    sections.push(this.generateAssetNamesType(assetInfo, assetNameType));

    // 2. Asset Info Interface
    sections.push(this.generateAssetInfoInterface());

    // 3. Asset Props Types
    sections.push(this.generateAssetPropsTypes(assetPropsType));

    // 4. Size Types (옵션)
    if (this.config.typeGeneration.includeSizeTypes) {
      sections.push(this.generateSizeTypes());
    }

    // 5. Color Types (옵션)
    if (this.config.typeGeneration.includeColorTypes) {
      sections.push(this.generateColorTypes());
    }

    // 6. Asset Path Map
    sections.push(this.generateAssetPathMap(assetInfo, pathMapName));

    // 7. Utility Types
    sections.push(this.generateUtilityTypes(assetNameType));

    return sections.join('\n\n');
  }

  /**
   * Asset Names 유니온 타입 생성
   */
  generateAssetNamesType(assetInfo, typeName) {
    const names = assetInfo.map((asset) => `'${asset.name}'`).sort();

    return `/**
 * Asset 이름 타입
 * 모든 사용 가능한 Asset의 이름을 포함합니다
 */
export type ${typeName} = ${names.join(' | ')}`;
  }

  /**
   * Asset Info 인터페이스 생성
   */
  generateAssetInfoInterface() {
    return `/**
 * Asset 정보 인터페이스
 */
export interface AssetInfo {
  name: string
  filename: string
  path: string
  extension: string
  type: 'icon' | 'image' | 'asset'
  category: string
  assetDir: string
}`;
  }

  /**
   * Asset Props 타입들 생성
   */
  generateAssetPropsTypes(propsTypeName) {
    const { assetNameType } = this.config.typeGeneration;

    return `/**
 * Size 객체 타입
 */
export type SizeObject =
    | { width: number; height?: number }
    | { width?: number; height: number }
    | { width: number; height: number }

/**
 * Asset Size 타입
 */
export type AssetSize = SizeType | number | SizeObject

/**
 * Asset Color 타입
 */
export type AssetColor = ColorType | string

/**
 * Asset 컴포넌트 Props (원본 discriminated union)
 */
export type ${propsTypeName} =
    | {
            type: 'icon'
            name: ${assetNameType}
            src?: never
            extension?: string
            size?: AssetSize
            color?: AssetColor
            className?: string
            style?: React.CSSProperties
            'aria-label'?: string
            alt?: string
            fallback?: React.ReactNode
            ratio?: number
      }
    | {
            type: 'url'
            name?: never
            src: string
            extension?: never
            size?: AssetSize
            color?: AssetColor
            className?: string
            style?: React.CSSProperties
            'aria-label'?: string
            alt?: string
            fallback?: React.ReactNode
            ratio?: number
      }`;
  }

  /**
   * Size 타입들 생성
   */
  generateSizeTypes() {
    const sizeEntries = Object.entries(this.config.sizeMapping || {});
    const sizeNames = sizeEntries.map(([name]) => `'${name}'`).sort();

    return `/**
 * Size 타입
 */
export type SizeType = ${sizeNames.join(' | ')}

/**
 * Size 매핑
 */
export const sizeMap: Record<SizeType, number> = ${JSON.stringify(
      this.config.sizeMapping,
      null,
      2
    )}`;
  }

  /**
   * Color 타입들 생성
   */
  generateColorTypes() {
    const colorEntries = Object.entries(this.config.colorMapping || {});
    const colorNames = colorEntries.map(([name]) => `'${name}'`).sort();

    return `/**
 * Color 타입
 */
export type ColorType = ${colorNames.join(' | ')}

/**
 * Color 매핑
 */
export const colorMap: Record<ColorType, string> = ${JSON.stringify(
      this.config.colorMapping,
      null,
      2
    )}`;
  }

  /**
   * Asset Path Map 생성
   */
  generateAssetPathMap(assetInfo, mapName) {
    const { assetNameType } = this.config.typeGeneration;

    const entries = assetInfo
      .map((asset) => {
        return `  '${asset.name}': {
    name: '${asset.name}',
    filename: '${asset.filename}',
    path: '${asset.path}',
    extension: '${asset.extension}',
    type: '${asset.type}',
    category: '${asset.category}',
    assetDir: '${asset.assetDir}'
  }`;
      })
      .join(',\n');

    return `/**
 * Asset 경로 매핑
 * Asset 이름으로 파일 정보에 접근할 수 있습니다
 */
export const ${mapName}: Record<${assetNameType}, AssetInfo> = {
${entries}
}`;
  }

  /**
   * 유틸리티 타입들 생성
   */
  generateUtilityTypes(assetNameType) {
    return `// 유틸리티 타입들은 필요에 따라 추가할 수 있습니다.`;
  }

  /**
   * 타입 파일 작성
   */
  async writeTypeFile(typeDefinitions) {
    const outputDir = this.config.fileGeneration.outputDir;
    const outputFile = this.config.fileGeneration.outputFile || 'types.ts';
    const outputPath = join(outputDir, outputFile);

    // 디렉토리 생성
    await fs.mkdir(outputDir, { recursive: true });

    // 파일 존재 여부 확인 및 처리
    const shouldSkip = await this.handleFileOverwrite(outputPath, outputFile);
    if (shouldSkip) {
      return outputPath;
    }

    // 파일 헤더 생성
    const header = this.generateFileHeader();

    // 전체 내용 조합
    const content = `${header}\n\n${typeDefinitions}\n`;

    // 파일 작성
    await fs.writeFile(outputPath, content, 'utf8');

    console.log(chalk.green(`  ✓ TypeScript 타입 파일 생성: ${outputPath}`));
    return outputPath;
  }

  /**
   * 파일 덮어쓰기 처리
   * @param {string} filepath - 파일 경로
   * @param {string} filename - 파일명
   * @returns {boolean} - true이면 스킵, false이면 계속 진행
   */
  async handleFileOverwrite(filepath, filename) {
    try {
      await fs.access(filepath);
      // 파일이 존재함

      const overwriteMode =
        this.config.fileGeneration?.overwriteMode || 'overwrite';

      switch (overwriteMode) {
        case 'skip':
          console.log(
            chalk.yellow(`  ⚠️ ${filename} 파일이 이미 존재합니다. 건너뜁니다.`)
          );
          return true;

        case 'backup':
          const backupPath = `${filepath}.backup`;
          await fs.copyFile(filepath, backupPath);
          console.log(
            chalk.blue(`  📦 ${filename} 백업 생성: ${filename}.backup`)
          );
          return false;

        case 'overwrite':
        default:
          console.log(chalk.blue(`  🔄 ${filename} 파일을 덮어씁니다.`));
          return false;
      }
    } catch (error) {
      // 파일이 존재하지 않음 - 정상 진행
      return false;
    }
  }

  /**
   * 파일 헤더 생성
   */
  generateFileHeader() {
    const timestamp = new Date().toISOString();

    return `/**
 * 🎨 Asset Types
 *
 * Asset CodeGen에 의해 자동 생성된 TypeScript 타입 정의
 *
 * @generated ${timestamp}
 * @package ${this.config.projectName || 'asset-codegen'}
 */

import React from 'react'`;
  }
}
