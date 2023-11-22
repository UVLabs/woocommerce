/**
 * External dependencies
 */
import { useContext, useEffect, useState } from 'react';
import { WooFooterItem } from '@woocommerce/admin-layout';
import { PostTypeContext } from '@woocommerce/product-editor';
import { Button, NavigableMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore No types for this exist yet, natively (not until 7.0.0).
// Including `@types/wordpress__data` as a devDependency causes build issues,
// so just going type-free for now.
// eslint-disable-next-line @woocommerce/dependency-group
import { useSelect, select as WPSelect } from '@wordpress/data';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore No types for this exist yet.
// eslint-disable-next-line @woocommerce/dependency-group
import { useEntityProp } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { TemplateTabPanel } from './template-tab-panel';
import { TemplateEventsTabPanel } from './template-events-tab-panel';
import { HelpTabPanel } from './help-tab-panel';
import { ProductTabPanel } from './product-tab-panel';

function TabButton( {
	name,
	selectedTab,
	onClick,
	children,
}: {
	name: string;
	selectedTab: string;
	onClick: ( name: string ) => void;
	children: React.ReactNode;
} ) {
	return (
		<Button
			onClick={ () => onClick( name ) }
			aria-selected={ name === selectedTab }
			className="woocommerce-product-editor-dev-tools-bar__tab-button"
		>
			{ children }
		</Button>
	);
}

export function ProductEditorDevToolsBar( {
	onClose,
}: {
	onClose: () => void;
} ) {
	const postType = useContext( PostTypeContext );

	const [ id ] = useEntityProp( 'postType', postType, 'id' );

	const product = useSelect( ( select: typeof WPSelect ) =>
		select( 'core' ).getEditedEntityRecord( 'postType', postType, id )
	);

	const [ initialRender, setInitialRender ] = useState( true );

	const [ selectedBlock, setSelectedBlock ] = useState< any >( null );

	const [ selectedBlockTemplateId, setSelectedBlockTemplateId ] =
		useState< string >( '' );

	const selectedBlockInEditor = useSelect( ( select: typeof WPSelect ) =>
		select( 'core/block-editor' ).getSelectedBlock()
	);

	function findBlockByTemplateBlockId(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		blocks: any[],
		templateBlockId: string
	) {
		for ( const block of blocks ) {
			if ( block.attributes._templateBlockId === templateBlockId ) {
				return block;
			}

			if ( block.innerBlocks.length > 0 ) {
				const matchingInnerBlock = findBlockByTemplateBlockId(
					block.innerBlocks,
					templateBlockId
				) as unknown;
				if ( matchingInnerBlock ) {
					return matchingInnerBlock;
				}
			}
		}

		return null;
	}

	const selectedBlockByTemplateBlockId = useSelect(
		( select: typeof WPSelect ) => {
			const blocks = select( 'core/block-editor' ).getBlocks();
			return findBlockByTemplateBlockId(
				blocks,
				selectedBlockTemplateId
			);
		}
	);

	useEffect( () => {
		if ( ! selectedBlockInEditor ) {
			return;
		}

		setSelectedBlock( selectedBlockInEditor );
	}, [ selectedBlockInEditor ] );

	useEffect( () => {
		if ( ! selectedBlockByTemplateBlockId && initialRender ) {
			setInitialRender( false );
			return;
		}

		setSelectedBlock( selectedBlockByTemplateBlockId );
	}, [ selectedBlockByTemplateBlockId, initialRender ] );

	useEffect( () => {
		if ( ! selectedBlock ) {
			return;
		}

		setSelectedBlockTemplateId( selectedBlock.attributes._templateBlockId );
	}, [ selectedBlock ] );

	const evaluationContext = {
		postType,
		editedProduct: product,
	};

	const [ selectedTab, setSelectedTab ] = useState< string >( 'template' );

	function handleNavigate( _childIndex: number, child: HTMLButtonElement ) {
		child.click();
	}

	function handleTabClick( tabName: string ) {
		setSelectedTab( tabName );
	}

	return (
		<WooFooterItem>
			<div className="woocommerce-product-editor-dev-tools-bar">
				<div className="woocommerce-product-editor-dev-tools-bar__header">
					<div className="woocommerce-product-editor-dev-tools-bar__tabs">
						<NavigableMenu
							role="tablist"
							orientation="horizontal"
							onNavigate={ handleNavigate }
						>
							<TabButton
								name="template"
								selectedTab={ selectedTab }
								onClick={ handleTabClick }
							>
								{ __( 'Template', 'woocommerce' ) }
							</TabButton>
							<TabButton
								name="events"
								selectedTab={ selectedTab }
								onClick={ handleTabClick }
							>
								{ __( 'Template Events', 'woocommerce' ) }
							</TabButton>
							<TabButton
								name="product"
								selectedTab={ selectedTab }
								onClick={ handleTabClick }
							>
								{ __( 'Product', 'woocommerce' ) }
							</TabButton>
							<TabButton
								name="help"
								selectedTab={ selectedTab }
								onClick={ handleTabClick }
							>
								{ __( 'Help', 'woocommerce' ) }
							</TabButton>
						</NavigableMenu>
					</div>
					<div className="woocommerce-product-editor-dev-tools-bar__actions">
						<Button
							icon={ closeSmall }
							label={ __( 'Close', 'woocommerce' ) }
							onClick={ onClose }
						/>
					</div>
				</div>
				<div className="woocommerce-product-editor-dev-tools-bar__panel">
					<TemplateTabPanel
						evaluationContext={ evaluationContext }
						setSelectedBlockTemplateId={
							setSelectedBlockTemplateId
						}
						selectedBlockTemplateId={ selectedBlockTemplateId }
						selectedBlock={ selectedBlock }
						isSelected={ selectedTab === 'template' }
					/>
					<TemplateEventsTabPanel
						postType={ postType }
						isSelected={ selectedTab === 'events' }
					/>
					<ProductTabPanel
						evaluationContext={ evaluationContext }
						isSelected={ selectedTab === 'product' }
					/>
					<HelpTabPanel isSelected={ selectedTab === 'help' } />
				</div>
			</div>
		</WooFooterItem>
	);
}
